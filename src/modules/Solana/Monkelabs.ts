import constants from '../../constants/Solana/publicKeys';
import * as anchor from '@project-serum/anchor';
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ConfigAccount, ConfigAccountSchema } from './schemas/ConfigSchema';
import * as borsh from 'borsh';
import { extendBorsh } from './schemas/Borsh';
import { log } from '../../utils/logger';
import { returnConfig, sleep } from '../../utils/misc';
import base58 from 'bs58';
import nacl from 'tweetnacl';
import TpuProxy from './TPUClient/tpu_proxy';
import { parentPort } from 'worker_threads';
import os from 'os';

extendBorsh();

async function createMint(
    connection: anchor.web3.Connection,
    wallet: anchor.Wallet,
    configkey: anchor.web3.PublicKey,
    otherkey: anchor.web3.PublicKey,
    tokenmintkey: anchor.web3.PublicKey,
    tokenrecipkey: anchor.web3.PublicKey,
): Promise<{
    transaction: anchor.web3.Transaction,
    signer: anchor.web3.Signer
}> {
    try {
        const cfg_account = await connection.getAccountInfo(
            configkey
        );

        const parsed: ConfigAccount = borsh.deserializeUnchecked(
            ConfigAccountSchema,
            ConfigAccount,
            cfg_account!.data!,
        );

        let config = {
            pda_buf: +parsed.pda_buf,
            price: +parsed.price,
            index_cap: +parsed.index_cap,
            wl_key: parsed.wl_key,
            index_key: parsed.index_key,
            primary_wallet: parsed.primary_wallet,
            timeout: parsed.ctimeout,
            public: parsed.publicTime,
            presale: parsed.presaleTime,
            presalePrice: +parsed.presalePrice,
            token_mint_account:
                parsed.token_mint_account ||
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            token_recip_account: parsed.token_recip_account || undefined,
            token_price: parsed.token_price ? +parsed.token_price : undefined,
            token_option: parsed.token_option ? +parsed.token_option : 1,
        };

        const mint_kp = anchor.web3.Keypair.generate();

        const meta_program = constants.TOKEN_METADATA_PROGRAM_ID;

        const minter_program = constants.MONKE_LABS;
        const associated_program = constants.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID;

        const token_key = (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    wallet.publicKey.toBuffer(),
                    TOKEN_PROGRAM_ID.toBuffer(),
                    mint_kp.publicKey.toBuffer(),
                ],
                associated_program,
            )
        )[0];

        const meta_key = (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    new Uint8Array([109, 101, 116, 97, 100, 97, 116, 97]),
                    meta_program.toBuffer(),
                    mint_kp.publicKey.toBuffer(),
                ],
                meta_program,
            )
        )[0];

        const auth_key = (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    new Uint8Array([
                        config.pda_buf & 0xff,
                        (config.pda_buf & 0xff00) >> 8,
                    ]),
                    new Uint8Array([97, 117, 116, 104]),
                    minter_program.toBuffer(),
                ],
                minter_program,
            )
        )[0];

        const sys_key = new anchor.web3.PublicKey('11111111111111111111111111111111');
        const rent_key = new anchor.web3.PublicKey('SysvarRent111111111111111111111111111111111');

        const uniqPDA = (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    new Uint8Array([
                        config.pda_buf & 0xff,
                        (config.pda_buf & 0xff00) >> 8,
                    ]),
                    wallet.publicKey.toBuffer(),
                    minter_program.toBuffer(),
                ],
                minter_program,
            )
        )[0];

        const timePDA = (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    new Uint8Array([108, 116, 105, 109, 101]),
                    wallet.publicKey.toBuffer(),
                    minter_program.toBuffer(),
                ],
                minter_program,
            )
        )[0];

        const edition_key = (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    new Uint8Array([109, 101, 116, 97, 100, 97, 116, 97]),
                    meta_program.toBuffer(),
                    mint_kp.publicKey.toBuffer(),
                    new Uint8Array([101, 100, 105, 116, 105, 111, 110]),
                ],
                meta_program,
            )
        )[0];

        const their_wallet = new anchor.web3.PublicKey(config.primary_wallet);
        const ix_key = new anchor.web3.PublicKey(config.index_key);
        const wl_key = new anchor.web3.PublicKey(config.wl_key);
        const config_key = configkey;
        const other_key = otherkey;

        let token_mint_key = tokenmintkey;

        let token_recip_key = tokenrecipkey;

        if (config.token_mint_account !== undefined && config.token_mint_account) {
            token_mint_key = new anchor.web3.PublicKey(config.token_mint_account);
        }
        if (config.token_recip_account !== undefined && config.token_recip_account) {
            token_recip_key = new anchor.web3.PublicKey(config.token_recip_account);
        }

        let payer_st_key = (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    wallet.publicKey.toBuffer(),
                    TOKEN_PROGRAM_ID.toBuffer(),
                    token_mint_key.toBuffer(),
                ],
                associated_program,
            )
        )[0];

        // accounts
        let account_0 = { pubkey: ix_key, isSigner: false, isWritable: true },
            account_1 = { pubkey: their_wallet, isSigner: false, isWritable: true },
            account_2 = { pubkey: new anchor.web3.PublicKey('mnKzuL9RMtR6GeSHBfDpnQaefcMsiw7waoTSduKNiXM'), isSigner: false, isWritable: true },
            account_3 = { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            account_4 = { pubkey: wl_key, isSigner: false, isWritable: true },
            account_5 = { pubkey: token_key, isSigner: false, isWritable: true },
            account_6 = { pubkey: sys_key, isSigner: false, isWritable: false },
            account_7 = { pubkey: meta_key, isSigner: false, isWritable: true },
            account_8 = {
                pubkey: mint_kp.publicKey,
                isSigner: false,
                isWritable: true,
            },
            account_9 = { pubkey: meta_program, isSigner: false, isWritable: false },
            account_10 = { pubkey: rent_key, isSigner: false, isWritable: false },
            account_11 = { pubkey: auth_key, isSigner: false, isWritable: true },
            account_12 = {
                pubkey: TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
            account_13 = { pubkey: uniqPDA, isSigner: false, isWritable: true },
            account_14 = { pubkey: timePDA, isSigner: false, isWritable: true },
            account_15 = { pubkey: edition_key, isSigner: false, isWritable: true },
            account_16 = { pubkey: config_key, isSigner: false, isWritable: true },
            account_17 = {
                pubkey: new anchor.web3.PublicKey('Sysvar1nstructions1111111111111111111111111'),
                isSigner: false,
                isWritable: false,
            },
            account_18 = { pubkey: other_key, isSigner: false, isWritable: false },
            account_19 = { pubkey: token_mint_key, isSigner: false, isWritable: true },
            account_20 = { pubkey: payer_st_key, isSigner: false, isWritable: true },
            account_21 = { pubkey: token_recip_key, isSigner: false, isWritable: true };

        let mintRent = await connection.getMinimumBalanceForRentExemption(
            MintLayout.span,
        );

        let mintAccount = anchor.web3.SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mint_kp.publicKey,
            lamports: mintRent,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID,
        }),
            tokenAccount = Token.createAssociatedTokenAccountInstruction(
                associated_program,
                TOKEN_PROGRAM_ID,
                mint_kp.publicKey,
                token_key,
                wallet.publicKey,
                wallet.publicKey,
            ),
            create_token = Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint_kp.publicKey,
                0,
                wallet.publicKey,
                null,
            ),
            mint_into_token_account = Token.createMintToInstruction(
                TOKEN_PROGRAM_ID,
                mint_kp.publicKey,
                token_key,
                wallet.publicKey,
                [],
                1,
            ),
            instruction = new anchor.web3.TransactionInstruction({
                keys: [
                    account_0,
                    account_1,
                    account_2,
                    account_3,
                    account_4,
                    account_5,
                    account_6,
                    account_7,
                    account_8,
                    account_9,
                    account_10,
                    account_11,
                    account_12,
                    account_13,
                    account_14,
                    account_15,
                    account_16,
                    account_17,
                    account_18,
                    account_19,
                    account_20,
                    account_21,
                ],
                programId: minter_program,
                data: Buffer.from(new Uint8Array([9, 1])),
            }),
            create_time = new anchor.web3.TransactionInstruction({
                keys: [account_3, account_14, account_6],
                programId: minter_program,
                data: Buffer.from(new Uint8Array([14])),
            });

        let transaction = new anchor.web3.Transaction().add(
            mintAccount,
            create_token,
            tokenAccount,
            mint_into_token_account,
            create_time,
            instruction,
        );

        return {
            transaction: transaction,
            signer: mint_kp
        };
    } catch (err: unknown) {
        log('error', 'Unknown error while creating mint!');

        return await createMint(connection, wallet, configkey, otherkey, tokenmintkey, tokenrecipkey);
    };
};

export default class Monkelabs {
    private keypair: anchor.web3.Keypair;
    private wallet: anchor.Wallet;
    private rpc: string;
    private delay: number;
    private timestamp: number;
    private cmid: anchor.web3.PublicKey;
    private otherkey: anchor.web3.PublicKey;
    private tokenmintkey: anchor.web3.PublicKey;
    private tokenrecipkey: anchor.web3.PublicKey;
    private connection: anchor.web3.Connection;
    private signers: any;
    private transaction: any;
    private tpu: any;

    public constructor(options: {
        wallet: string;
        cmid: string;
        rpc: string;
        delay: number;
        timestamp: number;
        otherkey: string,
        tokenmintkey: string,
        tokenrecipkey: string,
    }) {
        this.rpc = options.rpc;
        this.keypair = anchor.web3.Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode(options.wallet));
        this.wallet = new anchor.Wallet(this.keypair);
        this.delay = options.delay;
        this.timestamp = options.timestamp;
        this.cmid = new anchor.web3.PublicKey(options.cmid);
        this.otherkey = new anchor.web3.PublicKey(options.otherkey);
        this.tokenmintkey = new anchor.web3.PublicKey(options.tokenmintkey);
        this.tokenrecipkey = new anchor.web3.PublicKey(options.tokenrecipkey);
        this.rpc = options.rpc;
        this.connection = new anchor.web3.Connection(this.rpc, { commitment: 'finalized' });
        this.signers = null;
        this.transaction = null;
        this.tpu = null;

        // @ts-ignore
        process.env.UV_THREADPOOL_SIZE = os.cpus().length;

        this.start();
    };

    private start = async (): Promise<void> => {
        try {
            log('misc', `Creating connections...`);
            const config: { rpc: string } = JSON.parse(returnConfig());

            this.tpu = await TpuProxy.create(new anchor.web3.Connection(config.rpc));
            await this.tpu.connect();

            this.timestamp == null ? this.mint() : this.waitForDrop();
        } catch (err: unknown) {
            log('error', `Error starting task`);

            await sleep(this.delay);

            this.start();
        };
    };

    private async waitForDrop(): Promise<void> {
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

    private async mint(): Promise<void> {
        try {
            let confirmed = false;
            let rawTransaction: Buffer = Buffer.from([]);

            log('misc', `Creating transaction...`);

            const mintObject: {
                transaction: anchor.web3.Transaction;
                signer: anchor.web3.Signer;
            } = await createMint(this.connection, this.wallet, this.cmid, this.otherkey, this.tokenmintkey, this.tokenrecipkey);

            this.transaction = mintObject.transaction;
            this.signers = [mintObject.signer];

            log('misc', `Fetching blockhash...`);

            const blockhash = await this.connection.getLatestBlockhash('processed');

            this.transaction.recentBlockhash = blockhash.blockhash;

            this.transaction.feePayer = this.wallet.publicKey;

            log('misc', `Signing transaction...`);

            const walletSignature = nacl.sign.detached(this.transaction.serializeMessage(), this.wallet.payer.secretKey);

            this.transaction.addSignature(this.wallet.publicKey, Buffer.from(walletSignature));

            this.transaction.partialSign(...this.signers);

            rawTransaction = (await this.wallet.signTransaction(this.transaction)).serialize();

            let sig = base58.encode(new Uint8Array(Buffer.from(rawTransaction)).slice(1, 65));

            while (!confirmed) {
                this.tpu.sendRawTransaction(rawTransaction, this.rpc);

                log('submit', `Submitted TX: ${base58.encode(new Uint8Array(Buffer.from(rawTransaction)).slice(1, 65))}`);

                const status = await this.connection.getSignatureStatus(sig);

                if (status.value !== null) {
                    if (status.value?.confirmationStatus !== null) {
                        confirmed = true;

                        log('success', `Transaction ${sig} has been confirmed on slot ${status.context.slot}`);
                    };
                };
            };

            this.mint();
        } catch (err: unknown) {
            log('error', `Unknown error while minting!`);

            await sleep(this.delay);

            this.mint();
        };
    };
};

async function start(task: any) {
    log('misc', `Creating client...`);

    new Monkelabs({
        wallet: task.wallet,
        cmid: task.cmid,
        rpc: task.rpc,
        delay: task.delay,
        timestamp: task.timestamp,
        otherkey: task.otherkey,
        tokenmintkey: task.tokenmintkey,
        tokenrecipkey: task.tokenrecipkey,
    });
};

parentPort?.on('message', (message: any) => {
    start(message);
});