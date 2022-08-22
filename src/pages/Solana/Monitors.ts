import inquirer from "inquirer";
import 'colorts/lib/string';
import { Monitors as Base } from "../../classes/pages/Solana/Monitors";
import { log, title } from "../../utils/logger";
import Package from '../../../package.json';
import Home from "../Home";

const version: string = Package.version;

export default class Monitors extends Base {
    public index = async (): Promise<void> => {
        console.clear();

        title(`Incognito CLI - Version ${version} - Monitors`);

        log('title');

        const prompt: { choice: string } = await inquirer.prompt([
            {
                name: 'choice',
                type: 'list',
                message: 'What would you like to do?'.magenta,
                choices: [
                    'Monitor Candy Machine',
                    'Monitor Launchpad',
                    'Back'
                ]
            }
        ]);

        this.handleOption(prompt.choice);
    };

    public handleOption = async (option: string): Promise<void> => {
        switch (option) {
            case 'Monitor Candy Machine':
                await this.beginMonitor('cm');
            case 'Monitor Launchpad':
                await this.beginMonitor('me');
            case 'Back':
                return new Home().index();
        };
    }
};