import * as anchor from '@project-serum/anchor';
import { log } from "../../utils/logger";
import { parentPort } from 'worker_threads';
import { returnConfig, sleep } from '../../utils/misc';
import TpuProxy from './TPUClient/tpu_proxy';
import constants from '../../constants/Solana/publicKeys';
import { serialize } from 'borsh';
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createAssociatedTokenAccountInstruction, getMasterEdition, getMetadata, getTokenWallet } from '../../constants/Solana/functions';
import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import base58 from 'bs58';
import os from 'os';
import EC from 'elliptic';
import { keccak256 } from 'js-sha3';

/*
this module worked on a couple drops so have fun with this - opm
*/

function getM(atr: any, ats: any, att: any, s4: any) {
    return concat([
        ats.toBytes(),
        atr,
        s4,
        att.toBytes(),
    ]);
}

function getH(atm: any, atn: any, s3: any) {
    var atp = atn.toString(2).length,
        atq = new Uint8Array([
            atp >= 8 ? (atn >> 8) & 255 : 0,
            atp >= 0 ? (atn >> 0) & 255 : 0,
        ])
    return sha(
        concat([
            s3,
            atq,
            atm.toBytes(),
        ])
    )
}

async function getS(atv: any, encodingString: string) {
    function atw(atx: any) {
        return Buffer.concat([
            atx.r.toArrayLike(Buffer, 'be', 32),
            atx.s.toArrayLike(Buffer, 'be', 32),
        ])
            .toString('hex')
    };

    var aty = { canonical: true };

    var atz = function (aua: any) {
        return new Uint8Array(
            aua.match(/.{1,2}/g).map(function (aub: any) {
                return parseInt(aub, 16)
            })
        )
    },
        aue = new EC.ec('secp256k1'),
        auf = encodingString,
        aug = aue.keyFromPrivate(
            anchor.utils.bytes.bs58.decode(auf).toString()
        ),
        auh = aug.getPrivate('hex'),
        aui = keccak256(atv),
        auj = aue.sign(
            aui,
            // @ts-ignore
            auh,
            'hex',
            aty
        );
    return {
        // @ts-ignore
        hash: atz(aui.toString('hex')),
        sig: atz(atw(auj)),
        id: auj.recoveryParam,
    };
};

function concat(arr: any[]) {
    var ars = 0;

    arr.forEach(function (art) {
        ars += art.length
    });

    var aru = new Uint8Array(ars),
        arv = 0;

    return (
        arr.forEach(function (arw) {
            aru.set(arw, arv)
            arv += arw.length
        }),
        aru
    )
};

async function sha(arq: any) {
    return createHash('sha256')
        .update(arq)
        .digest()
};

class Assignable {
    constructor(properties: any) {
        Object.keys(properties).map((key) => {
            // @ts-ignore
            return (this[key] = properties[key]);
        });
    }
}

class Payload extends Assignable { }

var ep = new Map([
    [
        Payload,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['entropy', 'u16'],
                ['data', [64]],
                ['id', 'u8'],
                [
                    'whitelist_config_index',
                    {
                        kind: 'option',
                        type: 'u16',
                    },
                ],
            ],
        },
    ],
]);

async function createTransaction(
    connection: anchor.web3.Connection,
    cmid: anchor.web3.PublicKey,
    programId: anchor.web3.PublicKey,
    wallet: anchor.Wallet,
    metadataConfigAccountKey: anchor.web3.PublicKey,
    Account4: anchor.web3.PublicKey,
    Account7: anchor.web3.PublicKey,
    Account8: anchor.web3.PublicKey,
    launchpadFeeAddress: anchor.web3.PublicKey,
    limit: anchor.web3.PublicKey,
    entropy: number,
    encodingString: string,
    s3: Uint8Array,
    s4: Uint8Array
): Promise<{ instructions: anchor.web3.TransactionInstruction[], signers: anchor.web3.Signer[] }> {
    try {
        let ate = wallet.publicKey;

        let atf = Math.round(
            10000 * Math.random()
        );

        let atg = await getH(
            cmid,
            atf,
            s3
        );

        let ash = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from('minting'),
                cmid.toBuffer(),
            ],
            programId
        );

        // metadata config key - account2 solscan
        let ath = metadataConfigAccountKey;

        let ati = new anchor.web3.Keypair();
        let t1 = programId;
        let t2 = ate;
        let t3 = ati.publicKey;
        let t4 = 65;

        let t5 = await connection.getMinimumBalanceForRentExemption(
            65,
            'confirmed'
        );

        let t6 = {
            programId: t1,
            fromPubkey: t2,
            newAccountPubkey: t3,
            space: t4,
            lamports: t5,
        };

        let atj = await anchor.web3.SystemProgram.createAccount(t6);

        let atk = new anchor.web3.Keypair();

        let atl = await anchor.web3.SystemProgram.createAccount({
            fromPubkey: ate,
            newAccountPubkey: atk.publicKey,
            space: MintLayout.span,
            lamports:
                await connection.getMinimumBalanceForRentExemption(
                    MintLayout.span,
                    'confirmed'
                ),
            programId: TOKEN_PROGRAM_ID,
        });

        let atm = Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            atk.publicKey,
            0,
            ate,
            ate
        );

        let aob = await getTokenWallet(
            ate,
            atk.publicKey
        );

        let ato = createAssociatedTokenAccountInstruction(
            aob[0],
            ate,
            ate,
            atk.publicKey
        );

        let atp = Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            atk.publicKey,
            aob[0],
            ate,
            [],
            1
        );

        let aoe = await getMetadata(atk.publicKey);

        let aof = await getMasterEdition(
            atk.publicKey
        );

        var atz: any = {};
        atz.pubkey = ate;
        atz.isSigner = false;
        atz.isWritable = true;

        // acc 1
        var aua: any = {};
        aua.pubkey = cmid;
        aua.isSigner = false;
        aua.isWritable = true;

        // acc 2
        var aub: any = {};
        aub.pubkey = ath;
        aub.isSigner = false;
        aub.isWritable = false;

        // acc 3
        var auc: any = {};
        auc.pubkey = TOKEN_PROGRAM_ID;
        auc.isSigner = false;
        auc.isWritable = false;

        let ats: any[] = [
            atz,
            aua,
            aub,
            auc,
            {
                // account 4 solscan
                pubkey: Account4,
                isSigner: false,
                isWritable: false
            },
        ];

        var aue: any = {};
        // acc 5
        aue.pubkey = limit;
        aue.isSigner = false;
        aue.isWritable = true;
        var auf: any = {};
        auf.pubkey = launchpadFeeAddress;
        auf.isSigner = false;
        auf.isWritable = true;
        var aug: any = {};
        aug.pubkey = ash[0];
        aug.isSigner = false;
        aug.isWritable = false;
        var auh: any = {};
        auh.pubkey = atk.publicKey;
        auh.isSigner = false;
        auh.isWritable = true;
        var aui: any = {};
        aui.pubkey = aoe[0];
        aui.isSigner = false;
        aui.isWritable = true;
        var auj: any = {};
        auj.pubkey = aof[0];
        auj.isSigner = false;
        auj.isWritable = true;
        var auk: any = {};
        auk.pubkey = ati.publicKey;
        auk.isSigner = false;
        auk.isWritable = true;
        var aul: any = {};
        aul.pubkey = constants.TOKEN_METADATA_PROGRAM_ID;
        aul.isSigner = false;
        aul.isWritable = false;

        ats.push(
            aue,
            auf,
            {
                pubkey: Account7,
                isSigner: false,
                isWritable: true,
            },
            aug,
            auh,
            aui,
            auj,
            auk,
            aul,
            {
                pubkey: anchor.web3.SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            },
            {
                pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
                isSigner: false,
                isWritable: false,
            },
        );

        let avw = await getS(
            getM(
                atg,
                aoe[0],
                atk.publicKey,
                s4
            ),
            encodingString
        )

        let atx = new anchor.web3.TransactionInstruction({
            programId: programId,
            keys: ats,
            data: Buffer.from(
                serialize(
                    ep,
                    new Payload({
                        instruction: 11,
                        entropy: atf,
                        data: avw.sig,
                        id: avw.id,
                        whitelist_config_index: null
                    })
                )
            ),
        });

        return {
            instructions: [
                atj,
                atl,
                atm,
                ato,
                atp,
                atx,
            ],
            signers: [
                ati,
                atk
            ]
        };
    } catch (err: unknown) {
        console.log(err);

        log('error', 'Unknown error while creating mint!');

        return await createTransaction(connection, cmid, programId, wallet, metadataConfigAccountKey, Account4, Account7, Account8, launchpadFeeAddress, limit, entropy, encodingString, s3, s4);
    };
};

export default class Solport {
    private keypair: anchor.web3.Keypair;
    private wallet: anchor.Wallet;
    private rpc: string;
    private delay: number;
    private timestamp: number;
    private cmid: anchor.web3.PublicKey;
    private connection: anchor.web3.Connection;
    private launchpadProgramId: anchor.web3.PublicKey;
    private launchpadFeeAddress: anchor.web3.PublicKey;
    private metadataConfigAccountKey: anchor.web3.PublicKey;
    private Account4: anchor.web3.PublicKey;
    private Account7: anchor.web3.PublicKey;
    private Account8: anchor.web3.PublicKey;
    private encodingString: string;
    private s3: Uint8Array;
    private s4: Uint8Array;
    private signers: any;
    private transaction: any;
    private tpu: any;

    public constructor(options: {
        wallet: string;
        cmid: string;
        rpc: string;
        delay: number;
        timestamp: number;
        launchpadProgramId: string;
        launchpadFeeAddress: string;
        metadataConfigAccountKey: string;
        Account4: string;
        Account7: string;
        Account8: string;
        encodingString: string;
        s3: string;
        s4: string;
    }) {
        this.rpc = options.rpc;
        this.keypair = anchor.web3.Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode(options.wallet));
        this.wallet = new anchor.Wallet(this.keypair);
        this.delay = options.delay;
        this.timestamp = options.timestamp;
        this.cmid = new anchor.web3.PublicKey(options.cmid);
        this.connection = new anchor.web3.Connection(this.rpc, { commitment: 'finalized' });
        this.launchpadProgramId = new anchor.web3.PublicKey(options.launchpadProgramId);
        this.launchpadFeeAddress = new anchor.web3.PublicKey(options.launchpadFeeAddress);
        this.metadataConfigAccountKey = new anchor.web3.PublicKey(options.metadataConfigAccountKey);
        this.Account4 = new anchor.web3.PublicKey(options.Account4);
        this.Account7 = new anchor.web3.PublicKey(options.Account7);
        this.Account8 = new anchor.web3.PublicKey(options.Account8);
        this.encodingString = options.encodingString;
        this.s3 = new TextEncoder().encode(
            anchor.utils.bytes.bs58.decode(options.s3).toString()
        );
        
        this.s4 = new TextEncoder().encode(
            anchor.utils.bytes.bs58.decode(options.s4).toString()
        );
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

    private async mint(): Promise<void> {
        try {
            let confirmed = false;
            let rawTransaction: Buffer = Buffer.from([]);

            log('misc', `Creating transaction...`);

            let ary = Math.round(10000 * Math.random());

            let limit = await anchor.web3.PublicKey.findProgramAddress(
                [
                    Buffer.from('wallet_limit'),
                    this.cmid.toBuffer(),
                    this.wallet.publicKey.toBuffer(),
                ],
                this.launchpadProgramId
            );

            const mintObject: {
                instructions: anchor.web3.TransactionInstruction[];
                signers: anchor.web3.Signer[];
            } = await createTransaction(
                this.connection,
                this.cmid,
                this.launchpadProgramId,
                this.wallet,
                this.metadataConfigAccountKey,
                this.Account4,
                this.Account7,
                this.Account8,
                this.launchpadFeeAddress,
                limit[0],
                ary,
                this.encodingString,
                this.s3,
                this.s4
            );

            let transaction = new anchor.web3.Transaction();
            mintObject.instructions.forEach((instruction: anchor.web3.TransactionInstruction) => transaction.add(instruction));

            this.transaction = transaction;
            this.signers = mintObject.signers;

            log('misc', `Fetching blockhash...`);

            const blockhash = await this.connection.getLatestBlockhash('processed');

            this.transaction.recentBlockhash = blockhash.blockhash;

            this.transaction.feePayer = this.wallet.publicKey;

            log('misc', `Signing transaction...`);

            this.transaction.partialSign(...this.signers);

            const walletSignature = nacl.sign.detached(this.transaction.serializeMessage(), this.wallet.payer.secretKey);

            this.transaction.addSignature(this.wallet.publicKey, Buffer.from(walletSignature));

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

    new Solport({
        wallet: task.wallet,
        cmid: task.cmid,
        rpc: task.rpc,
        delay: task.delay,
        timestamp: task.timestamp,
        launchpadProgramId: task.launchpadProgramId,
        launchpadFeeAddress: task.launchpadFeeAddress,
        metadataConfigAccountKey: task.metadataConfigAccountKey,
        Account4: task.Account4,
        Account7: task.Account7,
        Account8: task.Account8,
        encodingString: task.encodingString,
        s3: task.s3,
        s4: task.s4
    });
};

parentPort?.on('message', (message: any) => {
    start(message);
});