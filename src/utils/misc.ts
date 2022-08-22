import fs from 'fs';
import got from 'got';
import bs58 from 'bs58';
import * as web3 from '@solana/web3.js';
import { PATHS } from '../constants/paths';
import { log } from './logger';
import inquirer from 'inquirer';

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getTime = (): string => {
    let x: Date = new Date();
    let ampm: string = (x.getTime() >= 12) ? "PM" : "AM";

    return `${x.toLocaleDateString('pt-PT')} ${x.getHours()}:${x.getMinutes()}:${x.getSeconds()}.${x.getMilliseconds()} ${ampm}`;
};

export const returnConfig = (): string => {
    return fs.readFileSync(PATHS.config, 'utf-8');
};

export const returnPubKey = (uint8array: number[]): string => {
    const publicKey: web3.Keypair = web3.Keypair.fromSecretKey(new Uint8Array(uint8array));

    return publicKey.publicKey.toString();
};

export const getByteArray = (privateKey: string): number[] => {
    const byteArray: any = bs58.decode(privateKey);
    const buffer: unknown = Buffer.from(bs58.decode(privateKey));
    const uint8arr: number[] = Array.prototype.slice.call(buffer, byteArray);

    return uint8arr;
};

export const shortenAddress = (address: string, chars = 4): string => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const getIP = async (): Promise<string> => {
    try {
        const response = await got('https://api.ipify.org?format=json');

        return response.body;
    } catch (err: unknown) {
        throw "Error"
    }
};

export const getProxies = () => {
    try {
        const data = fs.readFileSync(`${process.cwd()}\\proxies.txt`, "utf-8");
        return data;
    } catch (err) {
        log(`error`, `Error getting proxies: ${err}`);
    }
};

export const createPrompt = async (type: string, message: string, mask: boolean): Promise<string> => {
    let settings;

    if (mask) {
        settings = {
            name: 'input',
            type: type,
            message: message.magenta,
            mask: '*'
        }
    } else {
        settings = {
            name: 'input',
            type: type,
            message: message.magenta,
        }
    }

    const answer: { input: string } = await inquirer.prompt([
        settings
    ]);

    return answer.input;
};