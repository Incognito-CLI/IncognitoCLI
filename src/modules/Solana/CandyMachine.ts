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
    getCandyMachineCreator,
    getCollectionAuthorityRecordPDA,
    getCollectionPDA,
    getMasterEdition,
    getMetadata,
    getNetworkExpire,
    getNetworkToken,
} from "../../constants/Solana/functions";
import os from "os";
import base58 from "bs58";

interface CollectionData {
    mint: anchor.web3.PublicKey;
    candyMachine: anchor.web3.PublicKey;
}

async function createCandyMachineMint(
    id: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    program: anchor.Program,
    candyMachineDetails: any
): Promise<{
    instructions: anchor.web3.TransactionInstruction[];
    signers: anchor.web3.Signer[];
}> {
    try {
        const mint = anchor.web3.Keypair.generate();

        const userTokenAccountAddress = (
            await getAtaForMint(mint.publicKey, payer)
        )[0];

        const userPayingAccountAddress = candyMachineDetails.tokenMint
            ? (await getAtaForMint(candyMachineDetails.tokenMint, payer))[0]
            : payer;

        const remainingAccounts = [];
        const signers = [mint];

        const instructions = [
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: mint.publicKey,
                space: MintLayout.span,
                lamports:
                    await program.provider.connection.getMinimumBalanceForRentExemption(
                        MintLayout.span
                    ),
                programId: TOKEN_PROGRAM_ID,
            }),
            Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                0,
                payer,
                payer
            ),
            createAssociatedTokenAccountInstruction(
                userTokenAccountAddress,
                payer,
                payer,
                mint.publicKey
            ),
            Token.createMintToInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                userTokenAccountAddress,
                payer,
                [],
                1
            ),
        ];

        if (candyMachineDetails.data.gatekeeper) {
            remainingAccounts.push({
                pubkey: (
                    await getNetworkToken(
                        payer,
                        candyMachineDetails.data.gatekeeper.gatekeeperNetwork
                    )
                )[0],
                isWritable: true,
                isSigner: false,
            });

            if (candyMachineDetails.data.gatekeeper.expireOnUse) {
                remainingAccounts.push({
                    pubkey: constants.CIVIC,
                    isWritable: false,
                    isSigner: false,
                });
                remainingAccounts.push({
                    pubkey: (
                        await getNetworkExpire(
                            candyMachineDetails.data.gatekeeper.gatekeeperNetwork
                        )
                    )[0],
                    isWritable: false,
                    isSigner: false,
                });
            }
        }
        if (candyMachineDetails.data.whitelistMintSettings) {
            const mint = new anchor.web3.PublicKey(
                candyMachineDetails.data.whitelistMintSettings.mint
            );

            const whitelistToken = (await getAtaForMint(mint, payer))[0];
            remainingAccounts.push({
                pubkey: whitelistToken,
                isWritable: true,
                isSigner: false,
            });

            if (candyMachineDetails.data.whitelistMintSettings.mode.burnEveryTime) {
                remainingAccounts.push({
                    pubkey: mint,
                    isWritable: true,
                    isSigner: false,
                });
                remainingAccounts.push({
                    pubkey: payer,
                    isWritable: false,
                    isSigner: true,
                });
            }
        }

        if (candyMachineDetails.data.tokenMint) {
            remainingAccounts.push({
                pubkey: userPayingAccountAddress,
                isWritable: true,
                isSigner: false,
            });
            remainingAccounts.push({
                pubkey: payer,
                isWritable: false,
                isSigner: true,
            });
        }

        const metadataAddress = await getMetadata(mint.publicKey);
        const masterEdition = await (await getMasterEdition(mint.publicKey))[0];

        const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(id);

        instructions.push(
            program.instruction.mintNft(creatorBump, {
                accounts: {
                    candyMachine: id,
                    candyMachineCreator,
                    payer: userPayingAccountAddress,
                    wallet: candyMachineDetails.wallet,
                    mint: mint.publicKey,
                    metadata: metadataAddress[0],
                    masterEdition,
                    mintAuthority: userPayingAccountAddress,
                    updateAuthority: userPayingAccountAddress,
                    tokenMetadataProgram: constants.TOKEN_METADATA_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                    recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
                    instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
                },
                remainingAccounts:
                    remainingAccounts.length > 0 ? remainingAccounts : undefined,
            })
        );

        const [collectionPDA] = await getCollectionPDA(id);
        const collectionPDAAccount =
            await program.provider.connection.getAccountInfo(collectionPDA);

        if (collectionPDAAccount && candyMachineDetails.data.retainAuthority) {
            try {
                const collectionData =
                    // @ts-ignore
                    (await program.account.collectionPda.fetch(
                        collectionPDA
                    )) as CollectionData;

                const collectionMint = collectionData.mint;
                const collectionAuthorityRecord = await getCollectionAuthorityRecordPDA(
                    collectionMint,
                    collectionPDA
                );

                if (collectionMint) {
                    const collectionMetadata = (await getMetadata(collectionMint))[0];
                    const collectionMasterEdition = (
                        await getMasterEdition(collectionMint)
                    )[0];

                    instructions.push(
                        await program.instruction.setCollectionDuringMint({
                            accounts: {
                                candyMachine: id,
                                metadata: metadataAddress[0],
                                payer: payer,
                                collectionPda: collectionPDA,
                                tokenMetadataProgram: constants.TOKEN_METADATA_PROGRAM_ID,
                                instructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
                                collectionMint,
                                collectionMetadata,
                                collectionMasterEdition,
                                authority: candyMachineDetails.authority,
                                collectionAuthorityRecord,
                            },
                        })
                    );
                }
            } catch (error) {
                console.error(error);
            }
        }

        return {
            instructions: instructions,
            signers: signers
        };
    } catch (err: unknown) {
        log("error", "Unknown error while creating mint!");

        return await createCandyMachineMint(
            id,
            payer,
            program,
            candyMachineDetails
        );
    }
}

export default class CandyMachine {
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

            const provider = new anchor.AnchorProvider(this.connection, this.wallet, {
                preflightCommitment: "processed",
            });

            const idl: any = await anchor.Program.fetchIdl(
                constants.CANDY_MACHINE_PROGRAM,
                provider
            );

            this.program = new anchor.Program(
                idl,
                constants.CANDY_MACHINE_PROGRAM,
                provider
            );

            this.candyMachineDetails = await this.program.account.candyMachine.fetch(
                this.cmid
            );

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
        }

        return;
    }

    private async mint(): Promise<void> {
        try {
            this.confirmed = false;
            let rawTransaction: Buffer = Buffer.from([]);

            log("misc", `Creating transaction...`);

            const mintObject: {
                instructions: anchor.web3.TransactionInstruction[];
                signers: anchor.web3.Signer[];
            } = await createCandyMachineMint(
                this.cmid,
                this.wallet.payer.publicKey,
                this.program,
                this.candyMachineDetails
            );

            let transaction = new anchor.web3.Transaction();
            mintObject.instructions.forEach(
                (instruction: anchor.web3.TransactionInstruction) =>
                    transaction.add(instruction)
            );

            this.transaction = transaction;
            this.signers = mintObject.signers;

            log("misc", `Fetching blockhash...`);

            const blockhash = await this.connection.getLatestBlockhash("processed");

            this.transaction.recentBlockhash = blockhash.blockhash;

            this.transaction.feePayer = this.wallet.publicKey;

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
                    };
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

    new CandyMachine({
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
