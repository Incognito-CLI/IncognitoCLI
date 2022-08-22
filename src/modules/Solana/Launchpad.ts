import * as anchor from '@project-serum/anchor';
import { log } from '../../utils/logger';
import { getProxies, returnConfig, sleep } from '../../utils/misc';
import TpuProxy from './TPUClient/tpu_proxy';
import constants from '../../constants/Solana/publicKeys';
import {
    base58_to_binary,
    // @ts-ignore
} from "base58-js";
import tough from 'tough-cookie';
import { getLaunchStagesInfo, getMasterEdition, getMetadata, getTokenWallet, limit } from '../../constants/Solana/functions';
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { got, Server } from '../../utils/TLS/GotTLS';
import { parentPort } from 'worker_threads';
import base58 from 'bs58';
import os from 'os';
import _ from 'lodash';

const cookiejar = new tough.CookieJar();
Server.connect();

async function getHomePage(
    delay: number,
    agentSettings: null | {
        proxy: string
    }
): Promise<void> {
    try {
        if (agentSettings) {
            let x = await got.get("https://wk-notary-prod.magiceden.io/", {
                headers: {
                    'authority': 'wk-notary-prod.magiceden.io',
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
                },
                cookieJar: cookiejar,
                proxy: agentSettings.proxy,
                redirect: true
            });
        } else {
            await got.get("https://wk-notary-prod.magiceden.io/", {
                headers: {
                    'authority': 'wk-notary-prod.magiceden.io',
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
                },
                cookieJar: cookiejar,
                redirect: true
            });
        }

        return;
    } catch (err: unknown) {
        log('error', 'Unknown error while fetching homepage!');

        await sleep(delay);

        return await getHomePage(delay, agentSettings);
    };
};

async function getSignature(
    B: any,
    W: any,
    agentSettings: null | {
        proxy: string
    },
    delay: number,
): Promise<any> {
    try {
        let a = {
            config: W.config.toBase58(),
            candyMachine: W.candyMachine.toBase58(),
            launchStagesInfo: W.launchStagesInfo.toBase58(),
            candyMachineWalletAuthority: W.candyMachineWalletAuthority.toBase58(),
            mintReceiver: W.mintReceiver.toBase58(),
            payer: W.payer.toBase58(),
            payTo: W.payTo.toBase58(),
            payFrom: W.payFrom.toBase58(),
            mint: W.mint.toBase58(),
            tokenAta: W.tokenAta.toBase58(),
            metadata: W.metadata.toBase58(),
            masterEdition: W.masterEdition.toBase58(),
            walletLimitInfo: W.walletLimitInfo.toBase58(),
            tokenMetadataProgram: W.tokenMetadataProgram.toBase58(),
            tokenProgram: W.tokenProgram.toBase58(),
            systemProgram: W.systemProgram.toBase58(),
            rent: W.rent.toBase58(),
            orderInfo: W.orderInfo.toBase58(),
            slotHashes: W.slotHashes.toBase58(),
            notary: W.notary.toBase58(),
            associatedTokenProgram: W.associatedTokenProgram.toBase58()
        };

        if (agentSettings) {
            const response = await got.post("https://wk-notary-prod.magiceden.io/mintix", {
                headers: {
                    'authority': 'wk-notary-prod.magiceden.io',
                    'accept': 'application/json, text/plain, /',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                    'sec-ch-ua-mobile': '?0',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    'origin': 'https://magiceden.io',
                    'referer': 'https://magiceden.io/',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
                },
                body: JSON.stringify({
                    params: B,
                    accounts: a
                }),
                proxy: agentSettings.proxy,
                // redirect: true
            });

            console.log(response.body);

            const body = JSON.parse(response.body);

            let i = anchor.web3.Transaction.from(base58_to_binary(body.tx))

            return i;
        } else {
            const response = await got.post("https://wk-notary-prod.magiceden.io/mintix", {
                headers: {
                    'authority': 'wk-notary-prod.magiceden.io',
                    'accept': 'application/json, text/plain, /',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                    'sec-ch-ua-mobile': '?0',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    'origin': 'https://magiceden.io',
                    'referer': 'https://magiceden.io/',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
                },
                body: JSON.stringify({
                    params: B,
                    accounts: a
                }),
                // redirect: true
            });

            console.log(response.body);

            const body = JSON.parse(response.body);

            let i = anchor.web3.Transaction.from(base58_to_binary(body.tx))

            return i;
        }
    } catch (err: unknown) {
        console.log(err);

        log('error', 'Unknown error while signing mint!');

        await sleep(delay);

        return await getSignature(B, W, agentSettings, delay);
    };
};

async function bump(payer: anchor.web3.PublicKey) {
    try {
        let s,
            c,
            m,
            d,
            l,
            p,
            f;

        let a: any = 0;
        let t = [payer].length > 1 && void 0 !== [payer][1] ? [payer][1] : 100;

        while (true) {
            if (!(a < t)) {
                throw 1;
            };

            let r = anchor.web3.Keypair.generate();
            let metadataFunctions = await Promise.all([getMetadata(r.publicKey), getMasterEdition(r.publicKey), getTokenWallet(payer, r.publicKey)]);

            if (s = metadataFunctions, c = s[0], c[0], m = c[1], d = s[1], d[0], l = d[1], p = s[2], p[0], f = p[1], 255 !== m || 255 !== l || 255 !== f) {
                a += 1;
            } else {
                return r;
            };
        };
    } catch (err: unknown) {

    };
};

async function createLaunchpadMint(
    connection: anchor.web3.Connection,
    id: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    program: anchor.Program,
    details: any,
    delay: number,
    paymentMint: string,
): Promise<{ B: {
    walletLimitInfoBump: number;
    inOrder: boolean;
    blockhash: string;
    needsNotary: boolean;
}, W: any, signers: anchor.web3.Signer[] }> {
    try {
        let l = null != details.notary && !details.notary.equals(anchor.web3.SystemProgram.programId);

        let x = await Promise.all(new Array(1).fill(null).map((async function () {
            return await bump(payer);
        })));

        let h = x.filter((function (e) {
            return null !== e
        }));

        let T = [];
        let I;

        if (!(I = h[0])) {
            throw 1;
        };

        let v = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, I.publicKey, payer);
        let N = await getMetadata(I.publicKey);
        let O = await getMasterEdition(I.publicKey);

        let k = await limit(id, payer);
        let L = k;
        let w = L[0];
        let P = L[1];
        let C = await getLaunchStagesInfo(id);

        let D = C;
        let K = D[0];
        let U = new anchor.web3.PublicKey(paymentMint);
        let G = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, U, details.walletAuthority);
        let W;
        
        if (U.equals(NATIVE_MINT)) {
            W = payer;
        } else {
            W = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, U, payer);
        };

        let B = [I];
        T.push(I);

        let M;

        log('misc', `Fetching blockhash...`);

        const blockhash = await connection.getLatestBlockhash('processed');

        let B1 = {
            walletLimitInfoBump: k[1],
            inOrder: false,
            blockhash: blockhash.blockhash,
            needsNotary: l
        };

        let W1 = {
            config: details.config,
            candyMachine: id,
            launchStagesInfo: K,
            candyMachineWalletAuthority: details.walletAuthority,
            mintReceiver: payer,
            payer: payer,
            payTo: G,
            payFrom: W,
            mint: I.publicKey,
            tokenAta: v,
            metadata: N[0],
            masterEdition: O[0],
            walletLimitInfo: w,
            tokenMetadataProgram: constants.TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            orderInfo: details.orderInfo,
            slotHashes: new anchor.web3.PublicKey("SysvarS1otHashes111111111111111111111111111"),
            notary: null !== (M = details.notary) && void 0 !== M ? M : anchor.web3.PublicKey.default,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        };

        return {
            B: B1,
            W: W1,
            signers: [I]
        };
    } catch (err: unknown) {
        log('error', 'Unknown error while creating mint!');

        await sleep(delay);

        return await createLaunchpadMint(connection, id, payer, program, details, delay, paymentMint);
    };
};

export default class Launchpad {
    private keypair: anchor.web3.Keypair;
    private wallet: anchor.Wallet;
    private rpc: string;
    private delay: number;
    private timestamp: number;
    private cmid: anchor.web3.PublicKey;
    private signers: any;
    private transaction: any;
    private candyMachineDetails: any;
    private program: any;
    private connection: anchor.web3.Connection;
    private tpu: any;
    private paymentMint: string;
    public agentSettings: any;
    private confirmed: boolean;

    public constructor(options: {
        wallet: string;
        cmid: string;
        rpc: string;
        delay: number;
        timestamp: number;
        paymentMint: string;
    }) {
        this.rpc = options.rpc;
        this.keypair = anchor.web3.Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode(options.wallet));
        this.wallet = new anchor.Wallet(this.keypair);
        this.delay = options.delay;
        this.cmid = new anchor.web3.PublicKey(options.cmid);
        this.rpc = options.rpc;
        this.timestamp = options.timestamp;
        this.connection = new anchor.web3.Connection(this.rpc, { commitment: 'finalized' });
        this.paymentMint = options.paymentMint;
        this.signers = null;
        this.transaction = null;
        this.program = null;
        this.tpu = null;
        this.confirmed = false;
        this.candyMachineDetails = {} as any;
        this.agentSettings = null;

        // @ts-ignore
        process.env.UV_THREADPOOL_SIZE = os.cpus().length;

        this.start();
    };

    public start = async (): Promise<void> => {
        try {
            log('misc', `Creating connections...`);

            try {
                const proxyList = getProxies();
                //@ts-ignore
                if (proxyList.split("\n").length > 0) {
                    //@ts-ignore
                    const temp = proxyList.split("\n")[Math.floor(Math.random() * proxyList.split("\n").length)];

                    if (temp.length < 5) {
                        throw new Error("Bad proxy");
                    }

                    const split = temp.split(":");

                    split[3] = split[3].replace(`\r`, ``);

                    let proxy = `http://${split[2]}:${split[3]}@${split[0]}:${split[1]}`;
                    log('misc', `Using proxy: ${proxy}`);

                    this.agentSettings = {
                        proxy: proxy
                    };
                };
            } catch (err) {
                log(`misc`, 'Skipping proxy');
            }

            await getHomePage(this.delay, this.agentSettings);

            const config: { rpc: string } = JSON.parse(returnConfig());

            const provider = new anchor.AnchorProvider(this.connection, this.wallet, {
                preflightCommitment: "processed",
            });

            const idl: any = await anchor.Program.fetchIdl(
                constants.LAUNCHPAD_PROGRAM,
                provider
            );

            this.program = new anchor.Program(idl, constants.LAUNCHPAD_PROGRAM, provider);

            this.candyMachineDetails = await this.program.account.candyMachine.fetch(this.cmid);

            this.tpu = await TpuProxy.create(new anchor.web3.Connection(config.rpc));
            await this.tpu.connect();

            this.timestamp == null ? this.mint() : this.waitForDrop();
        } catch (err: unknown) {
            log('error', `Error starting task`);

            await sleep(this.delay);

            this.start();
        };
    };

    public async waitForDrop(): Promise<void> {
        try {
            const diff = this.timestamp - Date.now();

            log('misc', `Waiting ${diff}ms for drop...`);

            setTimeout(() => {
                this.mint();
            }, diff);
        } catch (err: unknown) {
            log('error', `Unknown error while waiting for drop!`);

            await sleep(this.delay);

            this.waitForDrop();
        };
    };

    private async genTransaction(): Promise<void> {
        try {
            log('misc', `Creating transaction...`);

            const mintObject: {
                B: any,
                W: any,
                signers: any
            } = await createLaunchpadMint(
                this.connection, this.cmid, this.wallet.payer.publicKey, this.program, this.candyMachineDetails, this.delay, this.paymentMint
            );

            this.transaction = [mintObject.B, mintObject.W];
            this.signers = mintObject.signers;

            return;
        } catch (err: unknown) {
            log('error', `Unknown error while creating transaction!`);

            await sleep(this.delay);

            this.genTransaction();
        };
    };

    private async spamMint(transaction: Buffer, sig: string): Promise<void> {
        while (!this.confirmed) {
            log('submit', `Submitted TX: ${sig}`);

            this.tpu.sendRawTransaction(transaction, this.rpc);

            await sleep(10);
        };

        return;
    };

    public async mint(): Promise<void> {
        try {
            this.confirmed = false;
            let rawTransaction: Buffer = Buffer.from([]);

            await this.genTransaction();

            const B = this.transaction[0];
            const W = this.transaction[1];

            const transaction = await getSignature(B, W, this.agentSettings, this.delay);

            this.transaction = transaction;

            log('misc', `Signing transaction...`);

            this.transaction.partialSign(...this.signers);

            const signedTx = await this.wallet.signTransaction(this.transaction);
            
            rawTransaction = signedTx.serialize({
                verifySignatures: true
            });

            let sig = base58.encode(new Uint8Array(Buffer.from(rawTransaction)).slice(1, 65));

            this.spamMint(rawTransaction, sig);

            while (true) {
                const status = await this.connection.getSignatureStatus(sig);

                if (status.value !== null) {
                    if (status.value?.confirmationStatus !== null) {
                        this.confirmed = true;

                        log('success', `Transaction ${sig} has been confirmed on slot ${status.context.slot}`);

                        break;
                    };
                };
            };

            this.mint();
        } catch (err: unknown) {
            console.log(err);

            log('error', `Unknown error while minting!`);

            await sleep(this.delay);

            this.mint();
        };
    };
};

async function start(task: any) {
    log('misc', `Creating client...`);

    new Launchpad({
        wallet: task.wallet,
        cmid: task.cmid,
        rpc: task.rpc,
        delay: task.delay,
        timestamp: task.timestamp,
        paymentMint: task.paymentMint,
    });
};

parentPort?.on('message', (message: any) => {
    start(message);
});