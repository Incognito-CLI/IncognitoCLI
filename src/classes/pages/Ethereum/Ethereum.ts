import got from "got/dist/source";
import inquirer from "inquirer";
import { PATHS } from "../../../constants/paths";
import ContractMint from "../../../modules/Ethereum/ContractMint";
import { log } from "../../../utils/logger";
import { sleep } from "../../../utils/misc";
import CsvReader from "../../csvReader";
import fs from 'fs';
import CancelTX from "../../../modules/Ethereum/CancelTX";
import Sniper from "../../../modules/Ethereum/Opensea";
import { createPrompt } from "../../../utils/misc";

export abstract class Ethereum {
    abstract index(): Promise<void>;
    abstract handleOption(option: string): Promise<void>;

    public createTasks = async (): Promise<void> => {
        try {
            const mode: { choice: string } = await inquirer.prompt([
                {
                    name: 'choice',
                    type: 'list',
                    message: `Select module`.magenta,
                    choices: [
                        'Ethereum Contract',
                        'Opensea',
                        'Back'
                    ]
                }
            ]);
    
            if (mode.choice == 'Back') {
                return;
            } else if (mode.choice == 'Ethereum Contract') {
                const privateKey = await createPrompt('password', 'Input wallet private key: ', true);

                const contractAddress = await createPrompt('input', 'Input contract address: ', false);

                const mintFunction = await createPrompt('input', 'Input mint function name: ', false);

                const mintParameters = await createPrompt('input', 'Input mint parameters (separated by semicolon): ', false);

                const mintPrice = await createPrompt('input', 'Input total mint price: ', false);

                const startTime = await createPrompt('input', 'Input start timestamp: ', false);

                const maxFee = await createPrompt('input', 'Input max gas fee: ', false);

                const maxPriority = await createPrompt('input', 'Input max priority fee: ', false);

                const file = await createPrompt('input', 'Input name for csv file: ', false);
        
                if (!file || !privateKey || !contractAddress || !mintFunction || !mintParameters || !mintPrice || !startTime || !maxFee || !maxPriority) {
                    log('error', 'One or more inputs are blank!');
        
                    await sleep(2500);
        
                    return;
                };
    
                await new CsvReader({ path: `${process.cwd()}\\${file}` }).writeETHTasks(1, [ mode.choice.trim(), privateKey.trim(), contractAddress.trim(), mintFunction.trim(), mintParameters.trim(), mintPrice.trim(), startTime.trim(), "auto", maxFee.trim(), maxPriority.trim() ]);
    
                await sleep(2500);
    
                return;
            } else {
                const privateKey = await createPrompt('password', 'Input wallet private key: ', true);

                const contractAddress = await createPrompt('input', 'Input collection: ', false);

                const mintPrice = await createPrompt('input', 'Input total max price: ', false);

                const maxFee = await createPrompt('input', 'Input max gas fee: ', false);

                const maxPriority = await createPrompt('input', 'Input max priority fee: ', false);
    
                const mintParameters = await createPrompt('input', 'Input discord webhook (leave blank for none): ', false);

                const file = await createPrompt('input', 'Input name for csv file: ', false);
        
                if (!file || !privateKey || !contractAddress || !mintPrice || !maxFee || !maxPriority || !mintParameters) {
                    log('error', 'One or more inputs are blank!');
        
                    await sleep(2500);
        
                    return;
                };
    
                await new CsvReader({ path: `${process.cwd()}\\${file}` }).writeETHTasks(1, [ mode.choice.trim(), privateKey.trim(), contractAddress.trim(), "null", mintParameters.trim(), mintPrice.trim(), "null", "auto", maxFee.trim(), maxPriority.trim() ]);
    
                await sleep(2500);
    
                return;
            }
        } catch (err: unknown) {
            log('error', 'Unknown error while creating tasks!');

            await sleep(2500);
            
            return;
        };
    };

    private getContractABI = async (contractId: string, etherscanKey: string): Promise<string> => {
        try {
            const response = await got.get(`https://api.etherscan.io/api?module=contract&action=getabi&address=${contractId}&apikey=${etherscanKey}`, {
                headers: {
                    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
                    "upgrade-insecure-requests": "1",
                }
            });

            return response.body;
        } catch (err: unknown) {
            log('error', `Error getting contract ABI...`);

            await sleep(500);

            return this.getContractABI(contractId, etherscanKey);
        };
    }

    public startTasks = async (): Promise<void> => {
        try {
            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = await new CsvReader(answers);
                    let config = fs.readFileSync(PATHS.config, 'utf-8');

                    const tasks: {
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
                        providerUrl: string;
                        abi: any;
                    }[] = await parser.returnETHTasks();

                    if (tasks[0].mode == 'Ethereum Contract') {
                        const abi = await this.getContractABI(tasks[0].contractAddress, JSON.parse(config).etherscanKey);

                        tasks.forEach(async (task: {
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
                            providerUrl: string;
                            abi: any;
                        }): Promise<void> => {
                            let child = task;

                            child.providerUrl = JSON.parse(config).alchemyKey;

                            child.abi = JSON.parse(abi);

                            await new ContractMint(child).start();
                        });
                    } else if (tasks[0].mode == 'Opensea') {
                        tasks.forEach(async (task: {
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
                            providerUrl: string;
                        }): Promise<void> => {
                            let child = task;

                            child.providerUrl = JSON.parse(config).alchemyKey;

                            await new Sniper(child).start();
                        });
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

    public startCancelTasks = async (): Promise<void> => {
        try {
            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);
                    let config: any = fs.readFileSync(PATHS.config, 'utf-8');

                    const tasks: {
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
                        providerUrl: string;
                        abi: any;
                    }[] = await parser.returnETHTasks();

                    const abi = await this.getContractABI(tasks[0].contractAddress, JSON.parse(config).etherscanKey);

                    tasks.forEach(async (task: {
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
                        providerUrl: string;
                        abi: any;
                    }): Promise<void> => {
                        let child = task;

                        child.providerUrl = JSON.parse(config).alchemyKey;

                        child.abi = JSON.parse(abi);

                        await new CancelTX(child).start();
                    });
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