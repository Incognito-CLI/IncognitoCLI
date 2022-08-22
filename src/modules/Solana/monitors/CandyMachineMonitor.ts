import * as anchor from '@project-serum/anchor';
import { returnConfig, sleep } from '../../../utils/misc';
import constants from '../../../constants/Solana/publicKeys';
import { log } from '../../../utils/logger';

export default class CandyMachineMonitor {
    private cmid: anchor.web3.PublicKey;
    private delay: number;

    constructor(options: {
        cmid: anchor.web3.PublicKey;
        delay: number;
    }) {
        this.cmid = options.cmid;
        this.delay = options.delay;
    };

    public monitor = async (): Promise<void> => {
        try {
            let fillerWallet: any;

            const config: { rpc: string } = JSON.parse(returnConfig());

            const connection = new anchor.web3.Connection(config.rpc, 'processed');

            const provider = new anchor.AnchorProvider(connection, fillerWallet, {
                preflightCommitment: "processed",
            });

            const idl: any = await anchor.Program.fetchIdl(
                constants.CANDY_MACHINE_PROGRAM,
                provider
            );

            const program = new anchor.Program(idl, constants.CANDY_MACHINE_PROGRAM, provider);

            while (true) {
                const state = await program.account.candyMachine.fetch(this.cmid);

                const itemsAvailable = state.data.itemsAvailable.toNumber();
                const itemsRedeemed = state.itemsRedeemed.toNumber();
                const price = state.data.price;
                const civic = state.data.gatekeeper == null ? false : true;
                const wl = state.data.tokenMint == null ? false : true;
                const isActive: boolean = state.data.goLiveDate.toNumber() < new Date().getTime() / 1000 && (state.endSettings ? state.endSettings.endSettingType.date ? state.endSettings.number.toNumber() > new Date().getTime() / 1000 : itemsRedeemed < state.endSettings.number.toNumber() : true);
        
                if (itemsRedeemed == itemsAvailable) {
                    log('error', `Release out of stock ${itemsRedeemed}/${itemsAvailable}`);
                } else {
                    log('misc', `In Stock, goLiveDate: ${state.data.goLiveDate.toNumber()}, wl?: ${wl}, live?: ${isActive}, civic?: ${civic}, stock: ${itemsRedeemed}/${itemsAvailable}, price: ${price/anchor.web3.LAMPORTS_PER_SOL}`);
                };
    
                await sleep(this.delay);
            };
        } catch (err: unknown) {            
            log('error', 'Unknown error while monitoring!');

            await sleep(this.delay);

            return this.monitor();
        };
    };
};