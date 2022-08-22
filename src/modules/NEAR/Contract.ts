import * as nearAPI from "near-api-js";
import JSBI from "jsbi";
import { log } from "../../utils/logger";

export default class Contract {
    monitorInput: any;
    accountName: string;
    privateKey: string;
    price: string;
    
    constructor(task: {
        monitorInput: string,
        privateKey: string,
        accountName: string,
        price: string,
    }) {
        this.monitorInput = task.monitorInput;
        this.privateKey = task.privateKey;
        this.accountName = task.accountName;
        this.price = task.price;
    }

    async mint() {
        const fees = {
            STORAGE_ADD_MARKET_FEE: '8590000000000000000000',
            STORAGE_MINT_FEE: '11280000000000000000000',
            STORAGE_CREATE_SERIES_FEE: '8540000000000000000000',
            STORAGE_APPROVE_FEE: '760000000000000000000',
            GAS_FEE: `100000000000000`,
            GAS_FEE_150: `150000000000000`,
            GAS_FEE_200: `200000000000000`,
            GAS_FEE_300: `300000000000000`,
            MAX_FILE_SIZE: 30 * 1024 * 1024,
        };

        log('misc', "Connecting to wallet...");
        const signerKeyPair = nearAPI.utils.KeyPair.fromString(this.privateKey);
        const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
        keyStore.setKey("mainnet", this.accountName, signerKeyPair);

        const near = await nearAPI.connect({
            deps: {
                keyStore,
            },
            nodeUrl: "https://rpc.mainnet.near.org",
            networkId: "mainnet",
            headers: {}
        });
        
        // Get parameters from mint
        const mintParameters = {
            "receiver_id": this.accountName,
            "actions": 'nft_mint_one'
        };
        const attachedDeposit = JSBI.add(JSBI.BigInt(parseInt(this.price) * 1000000000000000000000000), JSBI.BigInt(fees.STORAGE_MINT_FEE));
        const account = await near.account(this.accountName);

        // Attempt to mint
        log('submit', "Submitting mint...");
        try {
            const functionCallResponse = await account.functionCall({
                contractId: this.monitorInput,
                methodName: 'nft_mint_one',
                args: mintParameters, //@ts-ignore
                gas: fees.GAS_FEE, //@ts-ignore
                attachedDeposit: attachedDeposit.toString(),
            })
            const result = nearAPI.providers.getTransactionLastResult(
                functionCallResponse
            );
            log('success', "Check Wallet");
        } catch (e) {
            // Retry add sleep function here
            log('error', "Unknown error minting");
            this.mint();
        }
        return;
    }
}