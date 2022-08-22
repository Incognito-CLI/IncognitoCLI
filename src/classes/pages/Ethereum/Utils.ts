import inquirer from "inquirer";
import Package from '../../../../package.json';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { log, title } from "../../../utils/logger";
import CsvReader from "../../csvReader";
import { returnConfig, sleep } from "../../../utils/misc";
import { ethers } from "ethers";

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

const version: string = Package.version;

export abstract class Utils {
    abstract index(): Promise<void>;
    abstract handleOption(option: string): Promise<void>;

    public checkFunds = async (): Promise<void> => {
        try {
            title(`Incognito CLI - Version ${version} - Utils - Checking funds`);

            const config = JSON.parse(returnConfig());
            const provider = new ethers.providers.JsonRpcProvider(config.alchemyKey);

            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);

                    const privateKeys: string[] = await parser.returnETHPrivateKeys();

                    for (let x = 0; x < privateKeys.length; x++) {
                        while (true) {
                            try {
                                const wallet = new ethers.Wallet(privateKeys[x], provider);
                                log('misc', `Wallet ${wallet["address"]} has ${ethers.utils.formatEther(await provider.getBalance(wallet["address"])).slice(0, -11)} ETH`)

                                break;
                            } catch (err: unknown) {
                                log('error', 'Error while fetching funds');

                                await sleep(1500);
                            };
                        };
                    };

                    log('success', 'Successfully fetched all wallet funds!');

                    await sleep(5000);

                    return;
                } else {
                    log('error', 'Please select a CSV file!');

                    return this.checkFunds();
                };
            });
        } catch (err: unknown) {
            log('error', 'Unknown error while checking funds!');

            await sleep(2500);

            return;
        };
    };
};