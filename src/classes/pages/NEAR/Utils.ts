import inquirer from "inquirer";
import Package from '../../../../package.json';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { log, title } from "../../../utils/logger";
import CsvReader from "../../csvReader";
import { sleep } from "../../../utils/misc";
import * as nearAPI from "near-api-js";

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

const version: string = Package.version;

export abstract class Utils {
    abstract index(): Promise<void>;
    abstract handleOption(option: string): Promise<void>;

    public checkFunds = async (): Promise<void> => {
        try {
            title(`Incognito CLI - Version ${version} - Utils - Checking funds`);

            const keyStore = new nearAPI.keyStores.InMemoryKeyStore();

            const config = {
                networkId: "mainnet",
                nodeUrl: "https://rpc.mainnet.near.org",
                walletUrl: "https://wallet.mainnet.near.org",
                helperUrl: "https://helper.mainnet.near.org",
                explorerUrl: "https://explorer.mainnet.near.org",
                keyStore
            };

            //@ts-ignore
            const near = await nearAPI.connect(config);

            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);

                    const privateKeys: string[] = await parser.returnNEARKeys();

                    for (let x = 0; x < privateKeys.length; x++) {
                        while (true) {
                            try {
                                const account = await near.account(privateKeys[x]);
                                log('misc', `Wallet ${privateKeys[x].slice(0, -10)} has ${parseFloat((await account.getAccountBalance())['total']) / Math.pow(10, 24) } NEAR`)

                                break;
                            } catch (err: unknown) {
                                log('error', 'Error while fetching funds');
                                console.log(err);

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