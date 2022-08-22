import * as anchor from '@project-serum/anchor';
import { got } from '../utils/TLS/GotTLS';
// @ts-ignore
import capmonster from 'capmonster';
import { log } from '../utils/logger';
import { sleep } from '../utils/misc';

export default class Civic {
    wallet: anchor.Wallet;
    captcha: capmonster;

    constructor(values: {
        wallet: anchor.Wallet;
        captcha: capmonster;

    }) {
        this.wallet = values.wallet;
        this.captcha = values.captcha;
    };

    getRecord = async (publicKey: string): Promise<string> => {
        try {
            const response = await got.get(`https://gatekeeper-api.civic.com/v1/token/solana/${publicKey}?network=mainnet-beta&gatekeeperNetworkAddress=ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6`, {
                headers:  {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'Cache-Control': 'max-age=0',
                    'Connection': 'keep-alive',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="100", "Google Chrome";v="100"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                }
            });

            switch (response.statusCode) {
                case 404:
                    return 'No record';
                default:
                    return 'Record';
            }
        } catch (err: unknown) {
            log('error', 'Unknown error while fetching civic record!');

            return await this.getRecord(publicKey);
        };
    };

    solve = async (publicKey: string, token: string, proof: string): Promise<boolean> => {
        try {
            let body;
            let method: string = '';
            let url: string = '';

            const record = await this.getRecord(publicKey);

            switch (record) {
                case 'No record':
                    url = `https://gatekeeper-api.civic.com/v1/token/solana?network=mainnet-beta&gatekeeperNetworkAddress=ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6`;

                    method = 'POST';

                    body = {
                        "acceptedDeclaration": "1. You confirm, to your knowledge, that you're not a bot, do in fact breathe oxygen, and may or may not have what is commonly referred to as a soul.",
                        "acceptedTermsAndConditionsLink": "https://www.civic.com/legal/terms-of-service-civic-pass-v1",
                        "address": publicKey,
                        "captchaToken": token,
                        "proof": proof,
                        "provider": "hcaptcha"
                    };

                    break;
                case 'Record':
                    url = `https://gatekeeper-api.civic.com/v1/token/solana/${publicKey}?network=mainnet-beta&gatekeeperNetworkAddress=ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6`;

                    method = 'PATCH';

                    body = {
                        "proof": proof,
                        "request": "refresh",
                        "acceptedDeclaration": "1. You confirm, to your knowledge, that you're not a bot, do in fact breathe oxygen, and may or may not have what is commonly referred to as a soul.",
                        "provider": "hcaptcha",
                        "captchaToken": token
                    };

                    break;
            };

            const response = await got(
                method,
                url,
                {
                    headers: {
                        'accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        'Connection': 'keep-alive',
                        'Content-Length': String(JSON.stringify(body).length),
                        'content-type': 'application/json',
                        'Host': 'gatekeeper-api.civic.com',
                        'Origin': 'https://getpass.civic.com',
                        'Referer': 'https://getpass.civic.com/',
                        'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-site',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
                        'X-Civic-Client': '@civic/solana-gateway-react:0.4.12'
                    },
                    json: body
                }
            );

            const res: { state: string } = JSON.parse(response.body);

            switch (res.state) {
                case 'ACTIVE':
                case 'REQUESTED':
                case '{}':
                    return true;
                default:
                    log('error', `Error while solving civic for ${publicKey}... retrying`);

                    return false;
            };
        } catch (err: unknown) {
            log('error', 'Unknown error while solving civic!');

            return false;
        };
    };
    
    makeTransaction = async (connection: anchor.web3.Connection, fromPubkey: anchor.web3.PublicKey, toPubkey: anchor.web3.PublicKey, amount: number): Promise<anchor.web3.Transaction> => {
        try {
            const instruction: anchor.web3.TransactionInstruction = anchor.web3.SystemProgram.transfer({
                fromPubkey: fromPubkey,
                lamports: amount,
                toPubkey: toPubkey
            });
        
            const recentBlockhash: { blockhash: string } = await connection.getRecentBlockhash(
                'confirmed'
            );
        
            return new anchor.web3.Transaction({
                recentBlockhash: recentBlockhash.blockhash,
                feePayer: fromPubkey
            }).add(instruction);
        } catch (err: unknown) {
            log('error', 'Unknown error while solving civic!');

            return await this.makeTransaction(connection, fromPubkey, toPubkey, amount);
        };
    };

    createProof = async (key: anchor.web3.PublicKey, signer: anchor.Wallet): Promise<string> => {
        try {
            const connection: anchor.web3.Connection = new anchor.web3.Connection('https://civic.rpcpool.com/f40a068020b85335d0c8f2783747/', 'confirmed');

            const transaction: anchor.web3.Transaction = await this.makeTransaction(connection, key, key, 0);
        
            await signer.signTransaction(transaction);
        
            const serializedTx = transaction.serialize();
            
            return serializedTx.toString('base64');
        } catch (err: unknown) {
            log('error', 'Unknown error while solving civic!');

            return await this.createProof(key, signer);
        };
    };

    index = async (): Promise<void> => {
        while (true) {
            try {
                let token: any;
        
                const task = await this.captcha.createTask(
                    {
                        "type": "HCaptchaTask",
                        "websiteURL": "https://passv2.civic.com/",
                        "websiteKey": "3fe6bf88-7035-45b7-8f56-c9de61a1ca48"
                    }
                );

                while (!token) {
                    await this.captcha.getResult(task.taskId).then(async (result: { status: string; solution: { gRecaptchaResponse: string } }) => {
                        if (result.status == 'ready') {
                            token = result.solution.gRecaptchaResponse;
                        } else {
                            await sleep(2500);
                        }
                    });
                };

                const proof = await this.createProof(this.wallet.publicKey, this.wallet);
    
                const status: boolean = await this.solve(this.wallet.publicKey.toBase58(), token, proof);
    
                switch (status) {
                    case true:
                        log('success', `Solved civic for wallet: ${this.wallet.publicKey.toBase58()}`);

                        break;
                    default:
                        break;
                };
            } catch (err: unknown) {
                log('error', 'Unknown error while solving civic!');
            };
        };
    };
};