import { ethers, utils } from 'ethers';
import 'colorts/lib/string';
import { sleep } from '../../utils/misc';
import { log } from '../../utils/logger';

export default class CancelTX {
    totalPrice: any;
    mintFunction: any;
    parameters: any;
    privateKey: any;
    providerUrl: any;
    contractId: any;
    abiJson: any;
    maxFeeGas: any;
    maxPriority: any;
    gasLimit: any;
    taskProvider: any;
    taskWallet: any;
    transaction: any;

    constructor(task: any) {
        this.totalPrice = task.mintPrice;
        this.mintFunction = task.mintFunction; 
        this.parameters = task.mintParameters; 
        this.privateKey = task.privatekey;
        this.providerUrl = task.providerUrl;
        this.contractId = task.contractAddress; 
        this.abiJson = task.abi; 
        this.maxFeeGas = task.maxFeeGas;
        this.maxPriority = task.maxPriority;
        this.gasLimit = task.gasLimit;
    }
    
    async start() {
        try {
            await this.initialize();
            await this.connectProvider();
            await this.getTaskWallet();
            await this.buildTx();
            await this.sendTx();
        } catch (error) {
            await sleep(2500);
            this.start();
        }
    }

    async initialize() {
        try {
            this.taskProvider = new ethers.providers.JsonRpcProvider(this.providerUrl);
        } catch (error) {
            log('error', `[Incognito] - [Ethereum] - Error initializing task: ${error}`);
        }
    }

    async connectProvider() {
        try {
            log('misc', `[Incognito] - [Ethereum] - Connecting to: ${this.providerUrl}`);
            this.taskProvider = new ethers.providers.JsonRpcProvider(this.providerUrl);
        } catch (error) {
            log('error', `[Incognito] - [Ethereum] - Error initializing task: ${error}`);
        }
    }

    async getTaskWallet() {
        try {
            log('misc', `[Incognito] - [Ethereum] - Connecting to wallet...`);
            this.taskWallet = new ethers.Wallet(this.privateKey, this.taskProvider);
        } catch (error) {
            log('error', `[Incognito] - [Ethereum] - Error connecting to wallet: ${error}`);
        }
    }

    async buildTx() {
        try {
            log('misc', `[Incognito] - [Ethereum] - Creating new tx...`);

            const fees = await this.taskProvider.getFeeData();

            const contractConfig = { //@ts-ignore
                nonce: await this.taskProvider.getTransactionCount(this.taskWallet["address"]), //@ts-ignore
                from: this.taskWallet["address"],
                type: 2, //@ts-ignore
                to: this.taskWallet["address"],
                maxFeePerGas: parseInt(this.maxFeeGas + 100) * 1000000000,
                maxPriorityFeePerGas: parseInt(this.maxPriority + 100) * 1000000000,
                value: utils.parseEther("0.01"),
                chainId: 1,
            }

            this.transaction = await this.taskWallet?.signTransaction(contractConfig);
        } catch (error) {
            log('error', `[Incognito] - [Ethereum] - Error creating new tx: ${error}`);
        }
    }

    async sendTx() {
        try {
            log('misc', `[Incognito] - [Ethereum] - Sending tx`.cyan);
            const tx = await this.taskProvider.sendTransaction(this.transaction);
            log('misc', `[Incognito] - [Ethereum] - Sent ${tx.hash} on ${this.taskWallet?.address}`);
        } catch (error: any) {
            if (error.code == 'INSUFFICIENT_FUNDS') {
                log('error', `[Incognito] - [Ethereum] - ${this.taskWallet?.address} does not have enough funds.`);
            } else {
                log('error', `[Incognito] - [Ethereum] - Error sending tx: ${error}`);
            }
        }
    }
}