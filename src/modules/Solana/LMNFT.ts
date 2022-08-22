import * as anchor from "@project-serum/anchor";
import { log } from "../../utils/logger";
import { returnConfig, sleep } from "../../utils/misc";
import TpuProxy from "./TPUClient/tpu_proxy";
import constants from "../../constants/Solana/publicKeys";
import * as nacl from "tweetnacl";
import { parentPort } from "worker_threads";
import { MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    createAssociatedTokenAccountInstruction,
    getAtaForMint,
    getMasterEdition,
    getMetadata,
} from "../../constants/Solana/functions";
import os from "os";
import base58 from "bs58";

async function createMint(
    program: anchor.Program,
    cmid: anchor.web3.PublicKey,
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
    candyMachineDetails: any
): Promise<{
    tx: anchor.web3.Transaction;
    signers: anchor.web3.Signer[];
}> {
    try {
        const mint = anchor.web3.Keypair.generate();

        let w = await getMetadata(mint.publicKey);
        let x = await getMasterEdition(mint.publicKey);
        let k = await getAtaForMint(mint.publicKey, wallet.publicKey);

        let l = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("TotalMints"), wallet.publicKey.toBuffer(), cmid.toBuffer()],
            constants.LMNFT_PROGRAM
        );
        let d = l[0];
        let h = l[1];

        if (candyMachineDetails.mode == "v3") {
            let I = {
                candyMachine: cmid,
                payer: wallet.publicKey,
                wallet: candyMachineDetails.wallet,
                wallet2: new anchor.web3.PublicKey(
                    "33nQCgievSd3jJLSWFBefH3BJRN7h6sAoS82VFFdJGF5"
                ),
                metadata: w[0],
                mint: mint.publicKey,
                associated: k[0],
                masterEdition: x[0],
                totalMints: d,
                associatedTokenProgram:
                    constants.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
                tokenMetadataProgram: constants.TOKEN_METADATA_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            };

            // @ts-ignore
            let M = program.instruction.mintV3(null, {
                accounts: I,
                signers: [mint],
            });

            const blockhash = await connection.getLatestBlockhash("processed");

            let tx = new anchor.web3.Transaction({
                feePayer: wallet.publicKey,
                recentBlockhash: blockhash.blockhash,
            });

            tx.add(M);

            return { tx: tx, signers: [mint] };
        } else {
            let f = await anchor.web3.PublicKey.findProgramAddress([Buffer.from("candy_machine"), cmid.toBuffer()], constants.LMNFT_PROGRAM);

            let p = f[0];
            let g = f[1];

            let E = await connection.getMinimumBalanceForRentExemption(
                MintLayout.span
            );

            let A = [
                anchor.web3.SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mint.publicKey,
                    space: MintLayout.span,
                    lamports: E,
                    programId: TOKEN_PROGRAM_ID,
                }),
                Token.createInitMintInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    0,
                    wallet.publicKey,
                    wallet.publicKey
                ),
                createAssociatedTokenAccountInstruction(
                    k[0],
                    wallet.publicKey,
                    wallet.publicKey,
                    mint.publicKey
                ),
                Token.createMintToInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    k[0],
                    wallet.publicKey,
                    [],
                    1
                ),
            ];

            let I = {
                candyMachine: cmid,
                payer: wallet.publicKey,
                candyMachineCreator: p,
                wallet: candyMachineDetails.wallet,
                wallet2: new anchor.web3.PublicKey(
                    "33nQCgievSd3jJLSWFBefH3BJRN7h6sAoS82VFFdJGF5"
                ),
                metadata: w[0],
                mint: mint.publicKey,
                masterEdition: x[0],
                totalMints: d,
                tokenMetadataProgram: constants.TOKEN_METADATA_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            };

            // @ts-ignore
            let M = program.instruction.mintV2(g, h, null, {
                accounts: I,
                signers: [mint],
            });

            const blockhash = await connection.getLatestBlockhash("processed");

            let tx = new anchor.web3.Transaction({
                feePayer: wallet.publicKey,
                recentBlockhash: blockhash.blockhash,
            });

            A.forEach((instruction: anchor.web3.TransactionInstruction) => {
                tx.add(instruction);
            });

            tx.add(M);

            return { tx: tx, signers: [mint] };
        };
    } catch (err: unknown) {
        log("error", "Unknown error while creating mint!");

        await sleep(2500);

        return await createMint(
            program,
            cmid,
            wallet,
            connection,
            candyMachineDetails
        );
    }
}

export default class LMNFT {
    private keypair: anchor.web3.Keypair;
    private wallet: anchor.Wallet;
    private rpc: string;
    private delay: number;
    private timestamp: number;
    private cmid: anchor.web3.PublicKey;
    private connection: anchor.web3.Connection;
    private signers: any;
    private transaction: any;
    private tpu: any;
    private candyMachineDetails: any;
    private program: any;
    private confirmed: boolean;

    public constructor(options: {
        wallet: string;
        cmid: string;
        rpc: string;
        delay: number;
        timestamp: number;
    }) {
        this.rpc = options.rpc;
        this.keypair = anchor.web3.Keypair.fromSecretKey(
            anchor.utils.bytes.bs58.decode(options.wallet)
        );
        this.wallet = new anchor.Wallet(this.keypair);
        this.delay = options.delay;
        this.timestamp = options.timestamp;
        this.cmid = new anchor.web3.PublicKey(options.cmid);
        this.rpc = options.rpc;
        this.connection = new anchor.web3.Connection(this.rpc, {
            commitment: "finalized",
        });
        this.signers = null;
        this.transaction = null;
        this.program = null;
        this.tpu = null;
        this.confirmed = false;
        this.candyMachineDetails = {} as any;

        // @ts-ignore
        process.env.UV_THREADPOOL_SIZE = os.cpus().length;

        this.start();
    }

    private start = async (): Promise<void> => {
        try {
            log("misc", `Creating connections...`);
            const config: { rpc: string } = JSON.parse(returnConfig());

            const provider: anchor.Provider = new anchor.AnchorProvider(
                this.connection,
                this.wallet,
                {
                    preflightCommitment: "processed",
                }
            );

            const idl: any = await anchor.Program.fetchIdl(
                constants.LMNFT_PROGRAM,
                provider
            );

            this.program = new anchor.Program(idl, constants.LMNFT_PROGRAM, provider);

            try {
                this.candyMachineDetails = await this.program.account.candyMachineV3.fetch(this.cmid);

                this.candyMachineDetails.mode = "v3";
            } catch (err: unknown) {
                this.candyMachineDetails = await this.program.account.candyMachineV2.fetch(this.cmid);

                this.candyMachineDetails.mode = "v2";
            };

            this.tpu = await TpuProxy.create(new anchor.web3.Connection(config.rpc));
            await this.tpu.connect();

            this.timestamp == null ? this.mint() : this.waitForDrop();
        } catch (err: unknown) {
            log("error", `Error starting task`);

            await sleep(this.delay);

            this.start();
        }
    };

    private async waitForDrop(): Promise<void> {
        try {
            const diff = this.timestamp - Date.now();

            log("misc", `Waiting ${diff}ms for drop...`);

            setTimeout(() => {
                this.mint();
            }, diff);
        } catch (err: unknown) {
            log("error", `Unknown error while waiting for drop!`);

            await sleep(this.delay);

            this.waitForDrop();
        }
    }

    private async spamMint(transaction: Buffer, sig: string): Promise<void> {
        while (!this.confirmed) {
            log("submit", `Submitted TX: ${sig}`);

            this.tpu.sendRawTransaction(transaction, this.rpc);

            await sleep(10);
        };

        return;
    }

    private async mint(): Promise<void> {
        try {
            this.confirmed = false;
            let rawTransaction: Buffer = Buffer.from([]);

            log("misc", `Creating transaction...`);

            const mintObject: {
                tx: anchor.web3.Transaction;
                signers: anchor.web3.Signer[];
            } = await createMint(
                this.program,
                this.cmid,
                this.wallet,
                this.connection,
                this.candyMachineDetails
            );

            this.transaction = mintObject.tx;
            this.signers = mintObject.signers;

            log("misc", `Signing transaction...`);

            const walletSignature = nacl.sign.detached(
                this.transaction.serializeMessage(),
                this.wallet.payer.secretKey
            );

            this.transaction.addSignature(
                this.wallet.publicKey,
                Buffer.from(walletSignature)
            );

            this.transaction.partialSign(...this.signers);

            rawTransaction = (
                await this.wallet.signTransaction(this.transaction)
            ).serialize();

            let sig = base58.encode(
                new Uint8Array(Buffer.from(rawTransaction)).slice(1, 65)
            );

            this.spamMint(rawTransaction, sig);

            while (true) {
                const status = await this.connection.getSignatureStatus(sig);

                if (status.value !== null) {
                    if (status.value?.confirmationStatus !== null) {
                        this.confirmed = true;

                        log(
                            "success",
                            `Transaction ${sig} has been confirmed on slot ${status.context.slot}`
                        );

                        break;
                    }
                };
            };

            this.mint();
        } catch (err: unknown) {
            log("error", `Unknown error while minting!`);

            await sleep(this.delay);

            this.mint();
        }
    }
}

async function start(task: any) {
    log("misc", `Creating client...`);

    new LMNFT({
        wallet: task.wallet,
        cmid: task.cmid,
        rpc: task.rpc,
        delay: task.delay,
        timestamp: task.timestamp,
    });
}

parentPort?.on("message", (message: any) => {
    start(message);
});
