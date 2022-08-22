import inquirer from "inquirer";
import Package from '../../../../package.json';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { log, title } from "../../../utils/logger";
import CsvReader from "../../csvReader";
import { createPrompt, getByteArray, returnConfig, sleep } from "../../../utils/misc";
import * as anchor from '@project-serum/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import base58 from "bs58";
import fs from 'fs';
import Civic from "../../civic";
// @ts-ignore
import capmonster from 'capmonster';
import got from "got/dist/source";

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

const version: string = Package.version;

export abstract class Utils {
    abstract index(): Promise<void>;
    abstract handleOption(option: string): Promise<void>;

    public solveCivic = async () => {
        try {
            const config: { capmonsterKey: string } = JSON.parse(returnConfig());
            const captcha = new capmonster(config.capmonsterKey);
            
            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);

                    const privateKeys: string[] = await parser.returnPrivateKeys();

                    privateKeys.forEach((privateKey: string) => {
                        const wallet: anchor.Wallet = new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(new Uint8Array(getByteArray(privateKey))));

                        log('misc', `Looping civic for wallet ${wallet.publicKey.toBase58()}`.cyan);

                        new Civic({
                            wallet: new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(new Uint8Array(getByteArray(privateKey)))),
                            captcha
                        }).index();
                    });
                } else {
                    log('error', 'Please select a CSV file!');

                    return this.solveCivic();
                };
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while solving civic!');

            await sleep(2500);

            return;
        };
    };

    public rpcTester = async () => {
        try {
            const rpcUrl = await createPrompt('input', 'Input rpc to test: ', false);

            const startTime: number = performance.now();

            for (let x = 0; x < 100; x++) {
                await got.post(rpcUrl, {
                    json: {
                        id: 1,
                        jsonrpc: "2.0",
                        method: "getLatestBlockhash",
                        params: [
                            {
                                commitment: "processed"
                            }
                        ]
                    }
                });

                log('misc', `Request ${x} sent!`.cyan);
            };

            const endTime: number = performance.now();

            log('success', `100 RPC calls completed in ${endTime - startTime} milliseconds!`);

            await sleep(2500);

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while testing RPC!');

            await sleep(2500);

            return;
        };
    };

    public checkFormat = async (): Promise<void> => {
        try {
            title(`Incognito CLI - Version ${version} - Utils - Checking tasks format`);

            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    await new CsvReader(answers).correctForm();

                    await sleep(2500);

                    return;
                } else {
                    log('error', 'Please select a CSV file!');

                    return this.checkFormat();
                };
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while checking tasks format!');

            await sleep(2500);

            return;
        };
    };

    public checkFunds = async (): Promise<void> => {
        try {
            title(`Incognito CLI - Version ${version} - Utils - Checking funds`);

            const config: { rpc: string } = JSON.parse(returnConfig());
            const connection: anchor.web3.Connection = new anchor.web3.Connection(config.rpc, 'finalized');

            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);

                    const privateKeys: string[] = await parser.returnPrivateKeys();

                    for (let x = 0; x < privateKeys.length; x++) {
                        while (true) {
                            try {
                                const publicKey: anchor.web3.PublicKey = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getByteArray(privateKeys[x]))).publicKey;
                                const res = await connection.getAccountInfo(publicKey);

                                res ? log('misc', `Wallet ${publicKey} has ${res.lamports / anchor.web3.LAMPORTS_PER_SOL} SOL`) : log('misc', `Wallet ${publicKey} has 0 SOL`);

                                break;
                            } catch (err: unknown) {
                                log('error', 'Error while fetching funds... Congestion moment???');

                                await sleep(1500);
                            };
                        };
                    };

                    log('success', 'Successfully fetched all wallet funds!');

                    await sleep(2500);

                    return;
                } else {
                    log('error', 'Please select a CSV file!');

                    return this.checkFunds();
                };
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while checking funds!');

            await sleep(2500);

            return;
        };
    };

    public displayAllTokensInWallet = async () => {
        try {
            const config: { rpc: string } = JSON.parse(returnConfig());
            const connection: anchor.web3.Connection = new anchor.web3.Connection(config.rpc, 'finalized');

            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);

                    const privateKeys: string[] = await parser.returnPrivateKeys();

                    for (let x = 0; x < privateKeys.length; x++) {
                        const wallet: anchor.web3.Keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getByteArray(privateKeys[x])));

                        const nftsmetadata = await Metadata.findDataByOwner(connection, wallet.publicKey.toBase58());

                        if (nftsmetadata.length) {
                            for (const metadata of nftsmetadata) {
                                log('success', `Found 1 token named ${metadata.data.name} in wallet ${wallet.publicKey.toBase58()}`);
                            };
                        } else {
                            log('misc', `No NFTs with metadata to display in wallet ${wallet.publicKey.toBase58()}`);
                        };
                    };

                    await sleep(2500);

                    return;
                } else {
                    log('error', 'Please select a CSV file!');

                    return this.displayAllTokensInWallet();
                };
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while displaying NFTs!');

            await sleep(2500);

            return;
        };
    };

    public createWallets = async () => {
        try {
            let wallets: string[] = [];

            const amount: { input: string } = await inquirer.prompt([
                {
                    name: 'input',
                    type: 'input',
                    message: `Enter amount of wallets to create: `.cyan
                }
            ]);

            if (!parseInt(amount.input)) {
                log('error', 'Please enter a valid number.');

                await sleep(2000);

                this.createWallets();
            } else {
                const file: { name: string } = await inquirer.prompt([
                    {
                        name: 'name',
                        type: 'input',
                        message: `Enter file name to save created wallets to (enter .csv at the end): `.cyan
                    }
                ]);

                for (let x = 0; x < parseInt(amount.input); x++) {
                    wallets.push(base58.encode(Buffer.from(anchor.web3.Keypair.generate().secretKey)));
                };

                await fs.writeFileSync(`${process.cwd()}\\${file.name}`, 'privatekey\n');
                
                for (let x = 0; x < wallets.length; x++) {
                    await fs.appendFile(`${process.cwd()}\\${file.name}`, wallets[x] + '\n', () => {});

                    log('success', `Successfully created wallet ${wallets[x]}`);
                };

                await sleep(2500);

                return;
            };
        } catch (err: unknown) {
            log('error', 'Unknown error creating wallets!');

            await sleep(2500);

            return;
        };
    };

    public transferAllNfts = async () => {
        try {
            title(`Incognito CLI - Version ${version} - Utils - Transferring NFTs`);

            const config: { rpc: string } = JSON.parse(returnConfig());
            const connection: anchor.web3.Connection = new anchor.web3.Connection(config.rpc, 'finalized');

            const receiver: { receiver: string } = await inquirer.prompt([
                {
                    name: 'receiver',
                    type: 'password',
                    message: `Enter receiving wallet's private key:`.magenta,
                    mask: '*'
                }
            ]);

            const receivingWallet: anchor.web3.Keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getByteArray(receiver.receiver)));

            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = await new CsvReader(answers);

                    const privateKeys: string[] = await parser.returnPrivateKeys();

                    for (let x = 0; x < privateKeys.length; x++) {
                        while (true) {
                            try {
                                const sendingWallet: anchor.web3.Keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getByteArray(privateKeys[x])));
                                const response = await connection.getParsedTokenAccountsByOwner(sendingWallet.publicKey, { programId: TOKEN_PROGRAM_ID });

                                response.value.forEach(async (accountInfo) => {
                                    if (parseInt(accountInfo.account.data.parsed.info.tokenAmount.amount) > 0) {
                                        const fromTokenAccount: anchor.web3.PublicKey = await Token.getAssociatedTokenAddress(
                                            ASSOCIATED_TOKEN_PROGRAM_ID,
                                            TOKEN_PROGRAM_ID,
                                            new anchor.web3.PublicKey(accountInfo.account.data.parsed.info.mint),
                                            sendingWallet.publicKey
                                        );

                                        const toTokenAccount: anchor.web3.PublicKey = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, new anchor.web3.PublicKey(accountInfo.account.data.parsed.info.mint), receivingWallet.publicKey);

                                        let transferInstruction: anchor.web3.TransactionInstruction = await Token.createTransferInstruction(
                                            TOKEN_PROGRAM_ID,
                                            fromTokenAccount,
                                            toTokenAccount,
                                            sendingWallet.publicKey,
                                            [sendingWallet],
                                            parseInt(accountInfo.account.data.parsed.info.tokenAmount.amount)
                                        );

                                        const tx: string = await connection.sendTransaction(new anchor.web3.Transaction().add(transferInstruction), [sendingWallet]);

                                        log('success', `Sent NFTs! TX: ${tx}`);

                                        await sleep(1500);
                                    } else {
                                        log('misc', `No NFT to send.`);
                                    };
                                });

                                break;
                            } catch (err: unknown) {
                                log('error', 'Error while sending NFTs... Congestion moment???');

                                await sleep(1500);
                            };
                        }
                    };

                    await sleep(2500);

                    return;
                } else {
                    log('error', 'Please select a CSV file!');

                    return this.transferAllNfts();
                };
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while sending NFTs!');

            await sleep(2500);

            return;
        };
    };
};