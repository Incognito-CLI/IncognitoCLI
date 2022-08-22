import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import constants from './publicKeys';
import got from 'got';

export const getAtaForMint = async (
    mint: anchor.web3.PublicKey,
    buyer: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [buyer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        constants.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    );
};

export const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey
): anchor.web3.TransactionInstruction => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: constants.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        data: Buffer.from([]),
    });
};

export const getNetworkToken = async (
    wallet: anchor.web3.PublicKey,
    gatekeeperNetwork: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [
            wallet.toBuffer(),
            Buffer.from("gateway"),
            Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
            gatekeeperNetwork.toBuffer(),
        ],
        constants.CIVIC
    );
};

export const getNetworkExpire = async (
    gatekeeperNetwork: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [gatekeeperNetwork.toBuffer(), Buffer.from("expire")],
        constants.CIVIC
    );
};

export const getMetadata = async (
    mint: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("metadata"),
                constants.TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            constants.TOKEN_METADATA_PROGRAM_ID
        )
    );
};

export const getMasterEdition = async (
    mint: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("metadata"),
                constants.TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
                Buffer.from("edition"),
            ],
            constants.TOKEN_METADATA_PROGRAM_ID
        )
    );
};

export const getCandyMachineCreator = async (
    candyMachine: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("candy_machine"), candyMachine.toBuffer()],
        constants.CANDY_MACHINE_PROGRAM
    );
};

export const getTokenWallet = async (
    wallet: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            constants.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )
    );
};

export const getCollectionAuthorityRecordPDA = async (
    mint: anchor.web3.PublicKey,
    newAuthority: anchor.web3.PublicKey,
): Promise<anchor.web3.PublicKey> => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                constants.TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
                Buffer.from('collection_authority'),
                newAuthority.toBuffer(),
            ],
            constants.TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

export const getCollectionPDA = async (
    candyMachineAddress: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('collection'), candyMachineAddress.toBuffer()],
        constants.CANDY_MACHINE_PROGRAM,
    );
};

export const limit = async (cmid: anchor.web3.PublicKey, payer: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddress(
        [
            anchor.utils.bytes.utf8.encode("wallet_limit"),
            cmid.toBuffer(),
            payer.toBuffer(),
        ],
        constants.LAUNCHPAD_PROGRAM
    );
};

export const getLaunchStagesInfo = async (candyMachineId: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddress(
        [
            anchor.utils.bytes.utf8.encode("candy_machine"),
            anchor.utils.bytes.utf8.encode("launch_stages"),
            candyMachineId.toBuffer()
        ],
        constants.LAUNCHPAD_PROGRAM
    );
};

async function getChunk(link: string): Promise<string> {
    try {
        const response = await got(link, {
            headers: {
                "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
            },
        });

        return response.body;
    } catch (err: unknown) {
        return '';
    };
};

export async function getHome(homepage: string): Promise<any> {
    try {
        const response = await got(homepage, {
            headers: {
                "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
            },
        });

        const body = response.body;

        const chunk = body.substring(
            body.indexOf(`script src="/static/js/`) + 13,
            body.lastIndexOf(`.chunk.js"></script><script src`) + 9
        );

        const chunkBody: string = await getChunk(
            `${homepage}${chunk}`
        );

        const pda_buf = chunkBody.substring(chunkBody.lastIndexOf('REACT_APP_PDA_BUFFER:"') + 22, chunkBody.lastIndexOf('"}).TEST_RETRY_MULTIPLIER'));

        const primary_wallet = chunkBody.substring(chunkBody.lastIndexOf(',REACT_APP_PRIMARY_WALLET:"') + 27, chunkBody.lastIndexOf('",REACT_APP_PDA_BUFFER:'));

        const index_key = chunkBody.substring(chunkBody.lastIndexOf('",REACT_APP_INDEX_KEY:"') + 23, chunkBody.lastIndexOf('",REACT_APP_SOLANA_NETWORK'));

        const config_key = chunkBody.substring(chunkBody.lastIndexOf('",REACT_APP_CONFIG_KEY:"') + 24, chunkBody.lastIndexOf('",REACT_APP_CANDY_MACHINE'));

        const wl_key = chunkBody.substring(chunkBody.lastIndexOf(',REACT_APP_WHITELIST_KEY:"') + 26, chunkBody.lastIndexOf('",REACT_APP_MINT_UUID'));

        return {
            pda_buf: pda_buf,
            primary_wallet: primary_wallet,
            config_key: config_key,
            index_key: index_key,
            wl_key: wl_key
        };
    } catch (err: unknown) {
        console.log("Error getting homepage.");

        return;
    };
};