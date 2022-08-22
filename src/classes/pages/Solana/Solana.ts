import inquirer from "inquirer";
import { log } from "../../../utils/logger";
import { createPrompt, sleep } from "../../../utils/misc";
import CsvReader from "../../csvReader";
import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';

export abstract class Solana {
    abstract index(): Promise<void>;
    abstract handleOption(option: string): Promise<void>;

    public createTasks = async (): Promise<void> => {
        try {
            let tasksMode: string = '';

            const mode: { choice: string } = await inquirer.prompt([
                {
                    name: 'choice',
                    type: 'list',
                    message: `Select module`.magenta,
                    choices: [
                        'Candy Machine',
                        'Magic Eden Launchpad',
                        // 'Nova Launch',
                        'MonkeLabs',
                        'SolPort (Taiyo Robotics)',
                        'Back'
                    ]
                }
            ]);

            if (mode.choice == 'Back') return;

            mode.choice == 'Candy Machine' ? tasksMode = 'cm' : mode.choice == 'Nova Launch' ? tasksMode = 'nl' : mode.choice == 'Magic Eden Launchpad' ? tasksMode = 'me' : mode.choice == 'MonkeLabs' ? tasksMode = 'ml' : mode.choice == 'SolPort (Taiyo Robotics)' ? tasksMode = 'sp' : null;

            const privateKey = await createPrompt('password', 'Input wallet private key: ', true);

            const id = await createPrompt('input', 'Input candy machine id: ', false);

            const rpc = await createPrompt('input', 'Input rpc: ', false);

            const delay = await createPrompt('input', 'Input retry delay (in milliseconds): ', false);

            const amount = await createPrompt('input', 'Input amount of tasks to save: ', false);

            const file = await createPrompt('input', 'Input name for csv file: ', false);

            if (!privateKey || !id || !rpc || !delay || !amount || !file) {
                log('error', 'One or more inputs are blank!');

                await sleep(2500);

                return;
            };

            await new CsvReader({ path: `${process.cwd()}\\${file}` }).writeTasks(parseInt(amount.trim()), [tasksMode.trim(), privateKey.trim(), id.trim(), rpc.trim(), delay.trim()]);

            await sleep(2500);

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while creating tasks!');

            await sleep(2500);

            return;
        };
    };

    public startTasks = async (): Promise<void> => {
        try {
            let workers: Worker[] = [];

            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);

                    const tasks: {
                        mode: string;
                        wallet: string;
                        cmid: string;
                        rpc: string;
                        delay: number;
                        task: number;
                        limit: number;
                        timestamp: number;
                        launchpadProgramId: string;
                        launchpadFeeAddress: string;
                        generateDataEncoding: string;
                        generateHashEncoding: string;
                        metadataConfigAccountKey: string;
                        Account4: string;
                        Account7: string;
                        Account8: string;
                        instruction: string;
                        data: string;
                        hash: string;
                        paymentMint: string;
                        otherkey: string;
                        tokenmintkey: string;
                        tokenrecipkey: string;
                        mintPrice: number;
                        encodingString: string;
                        s3: string;
                        s4: string;
                    }[] = await parser.returnTasks();

                    let timestamp: string | null | number = await createPrompt('input', 'Input start date (unix form - leave blank if no timestamp): ', false);

                    timestamp == '' ? timestamp = null : timestamp = parseInt(timestamp.trim());

                    if (tasks[0].mode == 'me') {
                        const payment = await createPrompt('input', 'Input payment mint: ', false);

                        tasks.forEach((task: {
                            mode: string;
                            wallet: string;
                            cmid: string;
                            rpc: string;
                            delay: number;
                            task: number;
                            timestamp: string | number | null;
                            paymentMint: string;
                        }) => {
                            task.timestamp = timestamp;
                            task.paymentMint = payment;
                        });
                    } else if (tasks[0].mode == 'sp') {
                        const programId = await createPrompt('input', 'Input programId: ', false);

                        const launchpadFeeAddress = await createPrompt('input', 'Input fee address: ', false);

                        const metadataConfigAccountKey = await createPrompt('input', 'Input config key: ', false);

                        const account4 = await createPrompt('input', 'Input Account4: ', false);

                        const account7 = await createPrompt('input', 'Input Account7: ', false);

                        const account8 = await createPrompt('input', 'Input Account8: ', false);

                        const encoding = await createPrompt('input', 'Input encoding string: ', false);

                        const s3 = await createPrompt('input', 'Input secret 3: ', false);

                        const s4 = await createPrompt('input', 'Input secret 4: ', false);

                        tasks.forEach((task: {
                            mode: string;
                            wallet: string;
                            cmid: string;
                            rpc: string;
                            delay: number;
                            task: number;
                            limit: number;
                            timestamp: string | number | null;
                            launchpadProgramId: string;
                            launchpadFeeAddress: string;
                            metadataConfigAccountKey: string;
                            Account4: string;
                            Account7: string;
                            Account8: string;
                            encodingString: string;
                            s3: string;
                            s4: string;
                        }) => {
                            task.timestamp = timestamp;
                            task.launchpadProgramId = programId.trim();
                            task.launchpadFeeAddress = launchpadFeeAddress.trim();
                            task.metadataConfigAccountKey = metadataConfigAccountKey.trim();
                            task.Account4 = account4.trim();
                            task.Account7 = account7.trim();
                            task.Account8 = account8.trim();
                            task.encodingString = encoding.trim();
                            task.s3 = s3.trim();
                            task.s4 = s4.trim();
                        });
                    } else if (tasks[0].mode == 'ml') {
                        const otherkey = await createPrompt('input', 'Input other key: ', false);

                        const tokenmintkey = await createPrompt('input', 'Input token mint: ', false);

                        const tokenrecipkey = await createPrompt('input', 'Input token recip: ', false);

                        tasks.forEach((task: {
                            mode: string;
                            wallet: string;
                            cmid: string;
                            rpc: string;
                            delay: number;
                            task: number;
                            limit: number;
                            timestamp: string | number | null;
                            otherkey: string;
                            tokenmintkey: string;
                            tokenrecipkey: string;
                        }) => {
                            task.timestamp = timestamp;
                            task.otherkey = otherkey.trim();
                            task.tokenmintkey = tokenmintkey.trim();
                            task.tokenrecipkey = tokenrecipkey.trim();
                        });
                    } else {
                        tasks.forEach((task: {
                            mode: string;
                            wallet: string;
                            cmid: string;
                            rpc: string;
                            delay: number;
                            task: number;
                            timestamp: string | number | null;
                        }) => {
                            task.timestamp = timestamp;
                        });
                    };

                    let tasksPerThread = Math.floor(tasks.length / (os.cpus().length / 4));

                    tasksPerThread == 0 ? tasksPerThread++ : null;

                    for (let x = 0; x < (os.cpus().length / 4); x++) {
                        if (tasks[0].mode == 'me') {
                            workers.push(new Worker(`${process.cwd()}\\spam.js`, {
                                workerData: {
                                    path: path.resolve(__dirname, '../../../modules/Solana/Launchpad.ts')
                                }
                            }));
                        } else if (tasks[0].mode == 'sp') {
                            workers.push(new Worker(`${process.cwd()}\\spam.js`, {
                                workerData: {
                                    path: path.resolve(__dirname, '../../../modules/Solana/Solport.ts')
                                }
                            }));
                        } else if (tasks[0].mode == 'ml') {
                            workers.push(new Worker(`${process.cwd()}\\spam.js`, {
                                workerData: {
                                    path: path.resolve(__dirname, '../../../modules/Solana/Monkelabs.ts')
                                }
                            }));
                        } else if (tasks[0].mode == 'lmnft') {
                            workers.push(new Worker(`${process.cwd()}\\spam.js`, {
                                workerData: {
                                    path: path.resolve(__dirname, '../../../modules/Solana/LMNFT.ts')
                                }
                            }));
                        } else if (tasks[0].mode == 'temple') {
                            workers.push(new Worker(`${process.cwd()}\\spam.js`, {
                                workerData: {
                                    path: path.resolve(__dirname, '../../../modules/Solana/TempleMint.ts')
                                }
                            }));
                        } else {
                            workers.push(new Worker(`${process.cwd()}\\spam.js`, {
                                workerData: {
                                    path: path.resolve(__dirname, '../../../modules/Solana/CandyMachine.ts')
                                }
                            }));
                        };
                    };

                    // Divide up all tasks into threads
                    let taskChunks = [];
                    
                    while (tasks.length > 0) {
                        taskChunks.push(tasks.slice(0, tasksPerThread));
                        taskChunks.push(tasks.slice(0, tasksPerThread));
                        tasks.splice(0, tasksPerThread);
                    };

                    for (let x = 0; x < workers.length; x++) {
                        for (let y = 0; y < tasksPerThread; y++) {
                            if (!taskChunks[x]) {
                                break;
                            }
                            workers[x].postMessage(taskChunks[x][y]);
                        }
                    }
                } else {
                    log('error', 'Please select a CSV file!');

                    return this.startTasks();
                };
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while starting tasks!');

            await sleep(2500);

            return;
        };
    };
};