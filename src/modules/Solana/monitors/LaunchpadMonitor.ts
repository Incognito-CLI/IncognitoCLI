import * as anchor from '@project-serum/anchor';
import { returnConfig, sleep } from '../../../utils/misc';
import constants from '../../../constants/Solana/publicKeys';
import { log } from '../../../utils/logger';

export default class LaunchpadMonitor {
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
                constants.LAUNCHPAD_PROGRAM,
                provider
            );

            const program = new anchor.Program(idl, constants.LAUNCHPAD_PROGRAM, provider);

            while (true) {
                const state = await program.account.candyMachine.fetch(this.cmid);

                const itemsAvailable = state.itemsAvailable.toNumber();
                const itemsRedeemed = state.itemsRedeemedNormal.toNumber();
                        
                if (itemsRedeemed == itemsAvailable) {
                    log('error', `Release out of stock ${itemsRedeemed}/${itemsAvailable}`);
                } else {
                    log('misc', `In Stock, stock: ${itemsRedeemed}/${itemsAvailable}`);
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