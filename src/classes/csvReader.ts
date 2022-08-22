import fs from 'fs';
import csv from 'csv-parser';
import { log } from '../utils/logger';
import { sleep } from '../utils/misc';

export default class CsvReader {
    path: string;

    constructor(file: {
        path: string;
    }) {
        this.path = file.path;
    };

    public writeTasks = async (amount: number, options: string[]): Promise<void> => {
        try {
            let data: string = options.join(',');

            fs.writeFileSync(this.path, 'mode,privatekey,cmid,rpc,delay\n');
            
            for (let x = 0; x < amount; x++) {
                fs.appendFile(this.path, data + '\n', () => {});

                log('success', `Successfully saved task ${x}`);
            };

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while saving tasks!');

            await sleep(2500);

            return;
        };
    };

    public writeETHTasks = async (amount: number, options: string[]): Promise<void> => {
        try {
            let data: string = options.join(',');

            fs.writeFileSync(this.path, 'mode,privatekey,contractAddress,mintFunction,mintParameters,mintPrice,startTime,gasLimit,maxFee,maxPriority\n');
            
            for (let x = 0; x < amount; x++) {
                fs.appendFile(this.path, data + '\n', () => {});

                log('success', `Successfully saved task ${x}`);
            };

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while saving tasks!');

            await sleep(2500);

            return;
        };
    };

    public writeNEARTasks = async (amount: number, options: string[]): Promise<void> => {
        try {
            let data: string = options.join(',');

            fs.writeFileSync(this.path, 'mode,privateKey,monitorInput,accountName,price\n');
            
            for (let x = 0; x < amount; x++) {
                fs.appendFile(this.path, data + '\n', () => {});

                log('success', `Successfully saved task ${x}`);
            };

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while saving tasks!');

            await sleep(2500);

            return;
        };
    };

    public correctForm = async (): Promise<void> => {
        try {
            let x: number = 2;

            fs.createReadStream(this.path)
                .pipe(csv())
                .on('data', (data: {
                    mode: string;
                    privatekey: string;
                    cmid: string;
                    rpc: string;
                    delay: string;
                }): void => {
                    try {
                        if (data.mode && data.privatekey && data.cmid && data.rpc && data.delay) {
                            log('success', `Line ${x} has a correct task format!`);
                        } else {
                            log('error', `Line ${x} does not have a correct task format!`);
                        };
                    } catch (err: unknown) {
                        log('error', `Unknown error while checking task format on line ${x}!`);
                    };

                    x++;
                })
                .on('end', (): void => {
                    log('misc', `Finished checking task format!`);
                });

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while checking tasks format!');

            await sleep(2500);

            return;
        };
    };

    public returnTasks = async (): Promise<any> => {
        try {
            let x: number = 2;
            let tasks: {
                mode: string;
                wallet: string;
                cmid: string;
                rpc: string;
                delay: number;
            }[] = [];

            return await new Promise((resolve, reject) => {
                fs.createReadStream(this.path)
                    .pipe(csv())
                    .on('error', (err: unknown) => reject(err))
                    .on('data', (data: {
                        mode: string;
                        privatekey: string;
                        cmid: string;
                        rpc: string;
                        delay: string;
                    }): void => {
                        try {
                            tasks.push({
                                mode: data.mode,
                                wallet: data.privatekey,
                                cmid: data.cmid,
                                rpc: data.rpc,
                                delay: parseInt(data.delay)
                            });
                        } catch (err: unknown) {
                            log('error', `Unknown error while fetching task on line ${x}!`);
                        };

                        x++;
                    })
                    .on('end', () => {
                        resolve(tasks);
                    });
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while returning tasks!');

            await sleep(2500);

            return;
        };
    };

    public returnETHTasks = async (): Promise<any> => {
        try {
            let x: number = 2;
            let tasks: {
                mode: string;
                privatekey: string;
                contractAddress: string;
                mintFunction: string;
                mintParameters: string;
                mintPrice: string;
                startTime: string;
                gasLimit: string;
                maxFee: string;
                maxPriority: string;
            }[] = [];

            return await new Promise((resolve, reject) => {
                fs.createReadStream(this.path)
                    .pipe(csv())
                    .on('error', (err: unknown) => reject(err))
                    .on('data', (data: {
                        mode: string;
                        privatekey: string;
                        contractAddress: string;
                        mintFunction: string;
                        mintParameters: string;
                        mintPrice: string;
                        startTime: string;
                        gasLimit: string;
                        maxFee: string;
                        maxPriority: string;
                    }): void => {
                        try {
                            tasks.push({
                                mode: data.mode,
                                privatekey: data.privatekey,
                                contractAddress: data.contractAddress,
                                mintFunction: data.mintFunction,
                                mintParameters: data.mintParameters,
                                mintPrice: data.mintPrice,
                                startTime: data.startTime,
                                gasLimit: data.gasLimit,
                                maxFee: data.maxFee,
                                maxPriority: data.maxPriority,
                            });
                        } catch (err: unknown) {
                            log('error', `Unknown error while fetching task on line ${x}!`);
                        };

                        x++;
                    })
                    .on('end', () => {
                        resolve(tasks);
                    });
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while returning tasks!');

            await sleep(2500);

            return;
        };
    };

    public returnNEARTasks = async (): Promise<any> => {
        try {
            let x: number = 2;
            let tasks: {
                mode: string;
                privateKey: string;
                monitorInput: string;
                accountName: string;
                price: string;
            }[] = [];

            return await new Promise((resolve, reject) => {
                fs.createReadStream(this.path)
                    .pipe(csv())
                    .on('error', (err: unknown) => reject(err))
                    .on('data', (data: {
                        mode: string;
                        privateKey: string;
                        monitorInput: string;
                        accountName: string;
                        price: string;
                    }): void => {
                        try {
                            tasks.push({
                                mode: data.mode,
                                privateKey: data.privateKey,
                                monitorInput: data.monitorInput,
                                accountName: data.accountName,
                                price: data.price,
                            });
                        } catch (err: unknown) {
                            log('error', `Unknown error while fetching task on line ${x}!`);
                        };

                        x++;
                    })
                    .on('end', () => {
                        resolve(tasks);
                    });
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while returning tasks!');

            await sleep(2500);

            return;
        };
    };

    public returnPrivateKeys = async (): Promise<any> => {
        try {
            let x: number = 2;
            let privateKeys: string[] = [];

            return await new Promise((resolve, reject) => {
                fs.createReadStream(this.path)
                    .pipe(csv())
                    .on('error', (err: unknown) => reject(err))
                    .on('data', (data: {
                        mode: string;
                        privatekey: string;
                        cmid: string;
                        rpc: string;
                        delay: string;
                    }): void => {
                        try {
                            if (!privateKeys.includes(data.privatekey)) privateKeys.push(data.privatekey);
                        } catch (err: unknown) {
                            log('error', `Unknown error while fetching wallet on line ${x}!`);
                        };

                        x++;
                    })
                    .on('end', () => {
                        resolve(privateKeys);
                    });
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while fetching wallets!');

            await sleep(2500);

            return;
        };
    };

    public returnETHPrivateKeys = async (): Promise<any> => {
        try {
            let x: number = 2;
            let privateKeys: string[] = [];

            return await new Promise((resolve, reject) => {
                fs.createReadStream(this.path)
                    .pipe(csv())
                    .on('error', (err: unknown) => reject(err))
                    .on('data', (data: {
                        mode: string;
                        privatekey: string;
                        contractAddress: string;
                        mintFunction: string;
                        mintParameters: string;
                        mintPrice: string;
                        startTime: string;
                        gasLimit: string;
                        maxFee: string;
                        maxPriority: string;
                    }): void => {
                        try {
                            if (!privateKeys.includes(data.privatekey)) privateKeys.push(data.privatekey);
                        } catch (err: unknown) {
                            log('error', `Unknown error while fetching wallet on line ${x}!`);
                        };

                        x++;
                    })
                    .on('end', () => {
                        resolve(privateKeys);
                    });
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while fetching wallets!');

            await sleep(2500);

            return;
        };
    };

    public returnNEARKeys = async (): Promise<any> => {
        try {
            let x: number = 2;
            let privateKeys: string[] = [];

            return await new Promise((resolve, reject) => {
                fs.createReadStream(this.path)
                    .pipe(csv())
                    .on('error', (err: unknown) => reject(err))
                    .on('data', (data: {
                        mode: string;
                        privateKey: string;
                        monitorInput: string;
                        accountName: string;
                        price: string;
                    }): void => {
                        try {
                            if (!privateKeys.includes(data.accountName)) privateKeys.push(data.accountName);
                        } catch (err: unknown) {
                            log('error', `Unknown error while fetching wallet on line ${x}!`);
                        };

                        x++;
                    })
                    .on('end', () => {
                        resolve(privateKeys);
                    });
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while fetching wallets!');

            await sleep(2500);

            return;
        };
    };

};