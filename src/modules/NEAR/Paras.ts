import * as nearAPI from "near-api-js";
import JSBI from "jsbi";
import got from 'got/dist/source';
import { log } from '../../utils/logger';
import { sleep } from '../../utils/misc';

export default class Paras {
    monitorInput: string;
    accountName: string;
    privateKey: string;
    price: number;

    constructor(task: {
        monitorInput: string,
        privateKey: string,
        accountName: string,
        price: string,
    }) {
        this.monitorInput = task.monitorInput;
        this.privateKey = task.privateKey;
        this.accountName = task.accountName;
        this.price = parseFloat(task.price) * Math.pow(10, 24);
    }

    async start() {
        //@ts-ignore
        let [listing, floor] = await this.getListings();

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

        const params = {
            token_series_id: listing.token_series_id,
            receiver_id: this.accountName,
        }

        const attachedDeposit = JSBI.add(JSBI.BigInt(listing.lowest_price), JSBI.BigInt("11280000000000000000000"));
        const account = await near.account(this.accountName);

        try {
            const functionCallResponse = await account.functionCall({
                contractId: listing.contract_id,
                methodName: `nft_buy`,
                args: params, //@ts-ignore
                gas: 100000000000000, //@ts-ignore
                attachedDeposit: attachedDeposit.toString(),
            })
            const result = nearAPI.providers.getTransactionLastResult(
                functionCallResponse
            );
            log('success', 'Successfully sniped listing');
        } catch (e) {
            //@ts-ignore
            log('error', "Error sniping listing");
            await sleep(2500);
            this.start();
        }
        return;
    }

    async getListings() {
        let floor = 0;
        let lower = false;

        while (!lower) {
            let validListings: any[] = [];
            let listingsUnderMax: any[] = [];
            let allListings = await this.getAllListings();

            allListings.forEach((listing: any) => {
                if (listing.lowest_price !== null || listing.lowest_price !== '0') {
                    validListings.push(listing);
                    let realPrice = parseFloat((listing.lowest_price / 10 ** 24).toFixed(1));
                    if (realPrice <= parseFloat((this.price / 10 ** 24).toFixed(1))) {
                        listingsUnderMax.push(listing);
                    }
                }
            });

            floor = parseFloat((validListings[0].lowest_price / 10 ** 24).toFixed(1))
            if (listingsUnderMax.length > 0) {
                let randomListing = listingsUnderMax[this.randomRange(0, listingsUnderMax.length - 1)];
                let realPrice = parseFloat((randomListing.lowest_price / 10 ** 24).toFixed(1));
                log('misc', `Found listing @ ${realPrice} $NEAR`);
                return [randomListing, floor];
            } else {
                log('misc', `Monitoring: ${this.monitorInput}`);
                await sleep(5000);
            }
        }
    }

    async getAllListings() {
        try {
            const response = await got(`https://api-v2-mainnet.paras.id/token-series?collection_id=${this.monitorInput}&exclude_total_burn=true&__skip=0&__limit=16&__sort=lowest_price::1&min_price=10000000000000000000000`).json().catch(e => {
                console.log(e.response.body)
                log('error', "Unable to grab listings");
                return [];
            });
            //@ts-ignore
            return response.data.results;
        } catch (err: unknown) {
            log('error', "Unable to grab listings");
        }
    }

    randomRange(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}