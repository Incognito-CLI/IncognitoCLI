import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
    configkey: anchor.web3.PublicKey
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
            token_mint_account: parsed.token_mint_account || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            token_recip_account: parsed.token_recip_account || void 0,
            token_price: parsed.token_price ? +parsed.token_price : void 0,
            token_option: parsed.token_option ? +parsed.token_option : 1,
            our_wallet: parsed.our_wallet,
            token_mints: parsed.token_mints || null,
            col_mint: parsed.collection_key
        };

        let a = await connection.getAccountInfo(new anchor.web3.PublicKey(config.index_key));

        // @ts-ignore
        let s = (a.data[1] << 8) + a.data[0];

        let Q = new anchor.web3.PublicKey("mnKzuL9RMtR6GeSHBfDpnQaefcMsiw7waoTSduKNiXM"),
            Y = wallet.publicKey.toBuffer(),
            u = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
            d = new anchor.web3.PublicKey("miniYQHyKbyrPBftpouZJVo4S1SkoYJoKngtfiJB9yq"),
            p = new anchor.web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
            b = anchor.web3.Keypair.generate(),
            y = await anchor.web3.PublicKey.findProgramAddress([Y, TOKEN_PROGRAM_ID.toBuffer(), b.publicKey.toBuffer()], p),
            m = await anchor.web3.PublicKey.findProgramAddress([new Uint8Array([109, 101, 116, 97, 100, 97, 116, 97]), u.toBuffer(), b.publicKey.toBuffer()], u),
            g = await anchor.web3.PublicKey.findProgramAddress([new Uint8Array([255 & config.pda_buf, (65280 & config.pda_buf) >> 8]), new Uint8Array([97, 117, 116, 104]), d.toBuffer()], d),
            h = new anchor.web3.PublicKey("11111111111111111111111111111111"),
            w = new anchor.web3.PublicKey("SysvarRent111111111111111111111111111111111"),
            _ = await anchor.web3.PublicKey.findProgramAddress([new Uint8Array([255 & config.pda_buf, (65280 & config.pda_buf) >> 8]), Y, d.toBuffer()], d),
            k = await anchor.web3.PublicKey.findProgramAddress([new Uint8Array([108, 116, 105, 109, 101]), Y, d.toBuffer()], d),
            v = await anchor.web3.PublicKey.findProgramAddress([new Uint8Array([109, 101, 116, 97, 100, 97, 116, 97]), u.toBuffer(), b.publicKey.toBuffer(), new Uint8Array([101, 100, 105, 116, 105, 111, 110])], u),
            x = new anchor.web3.PublicKey(config.primary_wallet),
            P = new anchor.web3.PublicKey(config.index_key),
            S = new anchor.web3.PublicKey(config.wl_key),
            j = new anchor.web3.PublicKey(configkey),
            C = new anchor.web3.PublicKey("7FHzVCP9eX6zmZjw3qwvmdDMhSvCkLxipQatAqhtbVBf"),
            z = new anchor.web3.PublicKey(config.our_wallet || Q),
            A = new anchor.web3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
            K = new anchor.web3.PublicKey("Gdq32GtxXRr9t3BScA6VdtKZ7TFu62d6HBhrNFMZNto9"),
            O = await anchor.web3.PublicKey.findProgramAddress([Y, TOKEN_PROGRAM_ID.toBuffer(), A.toBuffer()], p),
            W = new anchor.web3.PublicKey(config.col_mint),
            B = await anchor.web3.PublicKey.findProgramAddress([new Uint8Array([109, 101, 116, 97, 100, 97, 116, 97]), u.toBuffer(), W.toBuffer()], u),
            E = await anchor.web3.PublicKey.findProgramAddress([new Uint8Array([109, 101, 116, 97, 100, 97, 116, 97]), u.toBuffer(), W.toBuffer(), new Uint8Array([101, 100, 105, 116, 105, 111, 110])], u);

        void 0 !== config.token_mint_account && config.token_mint_account && (A = new anchor.web3.PublicKey(config.token_mint_account));
        void 0 !== config.token_recip_account && config.token_recip_account && (K = new anchor.web3.PublicKey(config.token_recip_account));

        let T = {
            pubkey: wallet.publicKey,
            isSigner: !0,
            isWritable: !0
        },
        I = {
            pubkey: j,
            isSigner: !1,
            isWritable: !0
        },
        M = {
            pubkey: x,
            isSigner: !1,
            isWritable: !0
        },
        L = {
            pubkey: z,
            isSigner: !1,
            isWritable: !0
        },
        F = {
            pubkey: P,
            isSigner: !1,
            isWritable: !0
        },
        U = {
            pubkey: S,
            isSigner: !1,
            isWritable: !1
        },
        Z = {
            pubkey: y[0],
            isSigner: !1,
            isWritable: !1
        },
        H = {
            pubkey: h,
            isSigner: !1,
            isWritable: !1
        },
        q = {
            pubkey: m[0],
            isSigner: !1,
            isWritable: !0
        },
        G = {
            pubkey: b.publicKey,
            isSigner: !1,
            isWritable: !1
        },
        X = {
            pubkey: u,
            isSigner: !1,
            isWritable: !1
        },
        J = {
            pubkey: w,
            isSigner: !1,
            isWritable: !1
        },
        ee = {
            pubkey: new anchor.web3.PublicKey("Sysvar1nstructions1111111111111111111111111"),
            isSigner: !1,
            isWritable: !1
        },
        te = {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: !1,
            isWritable: !1
        },
        re = {
            pubkey: _[0],
            isSigner: !1,
            isWritable: !0
        },
        ie = {
            pubkey: k[0],
            isSigner: !1,
            isWritable: !0
        },
        ne = {
            pubkey: v[0],
            isSigner: !1,
            isWritable: !0
        },
        ae = {
            pubkey: C,
            isSigner: !1,
            isWritable: !1
        },
        oe = {
            pubkey: A,
            isSigner: !1,
            isWritable: 2 === (2 & s)
        },
        se = {
            pubkey: O[0],
            isSigner: !1,
            isWritable: 2 === (2 & s)
        },
        le = {
            pubkey: K,
            isSigner: !1,
            isWritable: 2 === (2 & s)
        },
        ce = {
            pubkey: W,
            isSigner: !1,
            isWritable: !1
        },
        ue = {
            pubkey: E[0],
            isSigner: !1,
            isWritable: !1
        },
        de = {
            pubkey: B[0],
            isSigner: !1,
            isWritable: !1
        },
        pe = {
            pubkey: g[0],
            isSigner: !1,
            isWritable: !0
        },
        fe = new anchor.web3.TransactionInstruction({
            keys: [{
                pubkey: wallet.publicKey,
                isSigner: !0,
                isWritable: !0
            }, {
                pubkey: b.publicKey,
                isSigner: !0,
                isWritable: !0
            }, {
                pubkey: y[0],
                isSigner: !1,
                isWritable: !0
            }, {
                pubkey: TOKEN_PROGRAM_ID,
                isSigner: !1,
                isWritable: !1
            }, {
                pubkey: p,
                isSigner: !1,
                isWritable: !1
            }, {
                pubkey: h,
                isSigner: !1,
                isWritable: !1
            }, {
                pubkey: w,
                isSigner: !1,
                isWritable: !1
            }],
            programId: d,
            data: Buffer.from(new Uint8Array([100]))
        }),
        be = new anchor.web3.TransactionInstruction({
            keys: [T, I, M, L, F, U, Z, H, q, G, X, J, ee, te, re, ie, ne, ae, oe, se, le, ce, ue, de, pe],
            programId: d,
            data: Buffer.from(new Uint8Array([10, s]))
        }),
        ye = new anchor.web3.TransactionInstruction({
            keys: [],
            programId: d,
            data: Buffer.from(new Uint8Array([250]))
        }),
        me = new anchor.web3.Transaction().add(new anchor.web3.TransactionInstruction({
            keys: [],
            programId: new anchor.web3.PublicKey("ComputeBudget111111111111111111111111111111"),
            data: Buffer.from(new Uint8Array([0, 48, 87, 5, 0, 0, 0, 0, 0]))
        }));

        me.add(fe, be, ye);

        return {
            transaction: me,
            signer: b
        };
    } catch (err: unknown) {
        log('error', 'Unknown error while creating mint!');

        return await createMint(connection, wallet, configkey);
    };
};

export default class TempleMint {
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

    public constructor(options: {
        wallet: string;
        cmid: string;
        rpc: string;
        delay: number;
        timestamp: number;
    }) {
        this.rpc = options.rpc;
        this.keypair = anchor.web3.Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode(options.wallet));
        this.wallet = new anchor.Wallet(this.keypair);
        this.delay = options.delay;
        this.timestamp = options.timestamp;
        this.cmid = new anchor.web3.PublicKey(options.cmid);
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
            } = await createMint(this.connection, this.wallet, this.cmid);

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

    new TempleMint({
        wallet: task.wallet,
        cmid: task.cmid,
        rpc: task.rpc,
        delay: task.delay,
        timestamp: task.timestamp
    });
};

parentPort?.on('message', (message: any) => {
    start(message);
});