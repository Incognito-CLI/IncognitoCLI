import { Connection } from "@solana/web3.js";
import bs58 from "bs58";
import dgram from "dgram";
import { sleep } from "../../../utils/misc";
import AvailableNodesService from "./available_nodes";
import LeaderScheduleService, {
    PAST_SLOT_SEARCH,
    UPCOMING_SLOT_SEARCH,
} from "./leader_schedule";
import LeaderTrackerService from "./leader_tracker";
import { endlessRetry } from "./utils";
import * as anchor from '@project-serum/anchor';

type TpuAddress = string;

// Proxy for sending transactions to the TPU port because
// browser clients cannot communicate to over UDP
export default class TpuProxy {
    connecting = false;
    lastSlot = 0;
    tpuAddresses = new Array<string>();
    sockets: Map<TpuAddress, dgram.Socket> = new Map();
    forwardingSockets: Map<TpuAddress, dgram.Socket> = new Map();
    socketPool: Array<dgram.Socket> = [];

    constructor(public connection: Connection) { }

    static async create(connection: Connection): Promise<TpuProxy> {
        const proxy = new TpuProxy(connection);
        const currentSlot = await endlessRetry(() =>
            connection.getSlot("processed")
        );
        const nodesService = await AvailableNodesService.start(connection);
        const leaderService = await LeaderScheduleService.start(
            connection,
            currentSlot
        );
        new LeaderTrackerService(connection, currentSlot, async (currentSlot) => {
            if (leaderService.shouldRefresh(currentSlot)) {
                await leaderService.refresh(currentSlot);
            }
            await proxy.refreshAddresses(leaderService, nodesService, currentSlot);
        });
        await proxy.refreshAddresses(leaderService, nodesService, currentSlot);
        return proxy;
    }

    connected = (): boolean => {
        return this.activeProxies() > 0;
    };

    activeProxies = (): number => {
        return this.sockets.size;
    };

    connect = async (): Promise<void> => {
        if (this.connecting) return;
        this.connecting = true;

        do {
            try {
                await this.reconnect();
            } catch (err) {
                await sleep(1000);
            }
        } while (!this.connected());

        // console.log(this.activeProxies(), "TPU port(s) connected");
        this.connecting = false;
    };

    sendRawTransaction = (
        rawTransaction: Uint8Array
    ): void => {
        if (!this.connected()) {
            this.connect();
            return;
        }

        this.sockets.forEach((socket, address) => {
            try {
                socket.send(rawTransaction, (err) => this.onTpuResult(address, err));
            } catch (err) {
                this.onTpuResult(address, err);
            }
        });

        this.forwardingSockets.forEach((socket, address) => {
            try {
                socket.send(rawTransaction, (err) => this.onTpuResult(address, err));
            } catch (err) {
                this.onTpuResult(address, err);
            }
        });
    };

    private refreshAddresses = async (
        leaderService: LeaderScheduleService,
        nodesService: AvailableNodesService,
        currentSlot: number
    ) => {
        const startSlotCurrent = await this.connection.getSlot('finalized');
        const leaders = await this.connection.getSlotLeaders(startSlotCurrent - 10, 30);
        const startSlot = currentSlot - PAST_SLOT_SEARCH;
        const endSlot = currentSlot + UPCOMING_SLOT_SEARCH;
        const tpuAddresses: Array<string> = [];
        const leaderAddresses = new Set<string>();

        // console.log(`Searching between slots {${startSlotCurrent-10}, ${startSlotCurrent+30}}`);

        leaders.forEach((leader: anchor.web3.PublicKey) => {
            if (leader !== null && !leaderAddresses.has(leader.toBase58())) {
                leaderAddresses.add(leader.toBase58());
                const tpu = nodesService.nodes.get(leader.toBase58());
                if (tpu) {
                    tpuAddresses.push(tpu);
                } else if (!nodesService.delinquents.has(leader.toBase58())) {
                    nodesService.delinquents.add(leader.toBase58());
                }
            }
        });

        for (let leaderSlot = startSlot; leaderSlot < endSlot; leaderSlot++) {
            const leader = leaderService.getSlotLeader(leaderSlot);
            if (leader !== null && !leaderAddresses.has(leader)) {
                leaderAddresses.add(leader);
                const tpu = nodesService.nodes.get(leader);
                if (tpu) {
                    tpuAddresses.push(tpu);
                } else if (!nodesService.delinquents.has(leader)) {
                    nodesService.delinquents.add(leader);
                }
            }
        }

        this.tpuAddresses = tpuAddresses;
        await this.connect();
    };

    private reconnect = async (): Promise<void> => {
        const sockets = new Map();
        const forwardingSockets = new Map();

        for (const tpu of this.tpuAddresses) {
            const [host, portStr] = tpu.split(":");
            const port = Number.parseInt(portStr);

            const poolSocket = this.socketPool.pop();
            let socket: dgram.Socket;
            let forwardingSocket: dgram.Socket;

            if (poolSocket) {
                poolSocket.removeAllListeners("error");
                socket = poolSocket;
                forwardingSocket = poolSocket;
            } else {
                socket = dgram.createSocket("udp4");
                forwardingSocket = dgram.createSocket("udp4");
            }

            await new Promise((resolve) => {
                socket.on("error", (err) => this.onTpuResult(tpu, err));
                socket.connect(port, host, () => resolve(undefined));

                forwardingSocket.on("error", (err) => this.onTpuResult(tpu, err));
                forwardingSocket.connect(port + 1, host, () => resolve(undefined));
            });
            sockets.set(tpu, socket);
            forwardingSockets.set(tpu, forwardingSocket);
        }

        const oldSockets = this.sockets;
        const oldForwardingSockets = this.forwardingSockets;

        this.sockets = sockets;
        this.forwardingSockets = sockets;

        oldSockets.forEach((socket) => {
            socket.disconnect();
            this.socketPool.push(socket);
        });

        oldForwardingSockets.forEach((socket) => {
            socket.disconnect();
            this.socketPool.push(socket);
        });
    };

    private onTpuResult = (address: string, err: unknown): void => {
        if (err) {
            const socket = this.sockets.get(address);
            if (socket) {
                this.sockets.delete(address);
                socket.disconnect();
                this.socketPool.push(socket);
            }
        }
    };
}