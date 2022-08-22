import inquirer from "inquirer";
import 'colorts/lib/string';
import { log, title } from "../utils/logger";
import Package from '../../package.json';
import Settings from "./Settings";
import Solana from "./Solana/Main";
import Ethereum from "./Ethereum/Main";
import { returnConfig } from "../utils/misc";
import { sleep } from "../utils/TLS/GotMain";
import NEAR from "./NEAR/Main";

const version: string = Package.version;

export default class Home {
    public index = async (): Promise<void> => {
        console.clear();

        title(`Incognito CLI - Version ${version} - Home`);

        log('title');

        const prompt: { choice: string } = await inquirer.prompt([
            {
                name: 'choice',
                type: 'list',
                message: 'Where would you like to go?'.magenta,
                choices: [
                    'Ethereum',
                    'NEAR',
                    'Solana',
                    'Settings'
                ]
            }
        ]);

        this.handleOption(prompt.choice);
    };

    private handleOption = async (option: string): Promise<void> => {
        switch (option) {
            case 'Ethereum':
                const config = JSON.parse(returnConfig());

                if (config.alchemyKey == "" || config.etherscanKey == "") {
                    log('error', 'Please set your Ethereum RPC and Etherscan key in settings!');

                    await sleep(2500);

                    return this.index();
                } else {
                    new Ethereum().index();

                    break;
                }
            case 'NEAR':
                new NEAR().index();

                break;
            case 'Solana':
                new Solana().index();

                break;
            case 'Settings':
                new Settings().index();

                break;
        }
    }
};