import inquirer from "inquirer";
import 'colorts/lib/string';
import { Settings as Base } from "../classes/pages/Settings";
import { log, title } from "../utils/logger";
import Package from '../../package.json';
import Home from "./Home";

const version: string = Package.version;

export default class Settings extends Base {
    public index = async (): Promise<void> => {
        console.clear();

        title(`Incognito CLI - Version ${version} - Settings`);

        log('title');

        const prompt: { choice: string } = await inquirer.prompt([
            {
                name: 'choice',
                type: 'list',
                message: 'What would you like to do?'.magenta,
                choices: [
                    'Configure capmonster',
                    'Set default solana RPC',
                    'Set ETH RPC & Etherscan',
                    'Back'
                ]
            }
        ]);

        this.handleOption(prompt.choice);
    };

    public handleOption = async (option: string): Promise<void> => {
        switch (option) {
            case 'Configure capmonster':
                await this.setSetting('Configuring capmonster', 'capmonsterKey', 'Enter capmonster API key', 'Configure capmonster - Successfully added client key!');

                break;
            case 'Set default solana RPC':
                await this.setSetting('Setting default solana RPC', 'rpc', 'Enter default solana RPC', 'Set default solana RPC - Successfully set default solana RPC!');

                break;
            case 'Set ETH RPC & Etherscan':
                await this.setSetting('Setting ETH RPC', 'alchemyKey', 'Enter ETH RPC url', 'Set ETH RPC - Successfully set ETH RPC!');
                await this.setSetting('Setting Etherscan API key', 'etherscanKey', 'Enter Etherscan API key', 'Set Etherscan API key - Successfully added API key!');

                break;
            case 'Back':
                return new Home().index();
        };

        return this.index();
    }
};