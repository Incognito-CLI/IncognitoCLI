import inquirer from "inquirer";
import 'colorts/lib/string';
import { Solana as Base } from "../../classes/pages/Solana/Solana";
import { log, title } from "../../utils/logger";
import Package from '../../../package.json';
import Home from "../Home";
import Utils from "./Utils";
import Monitors from "./Monitors";

const version: string = Package.version;

export default class Solana extends Base {
    public index = async (): Promise<void> => {
        console.clear();

        title(`Incognito CLI - Version ${version} - Tasks`);

        log('title');

        const prompt: { choice: string } = await inquirer.prompt([
            {
                name: 'choice',
                type: 'list',
                message: 'What would you like to do?'.magenta,
                choices: [
                    'Create tasks',
                    'Monitors',
                    'Run all tasks',
                    'Utils',
                    'Back'
                ]
            }
        ]);

        this.handleOption(prompt.choice);
    };

    public handleOption = async (option: string): Promise<void> => {
        switch (option) {
            case 'Run all tasks':
                await this.startTasks();

                break;
            case 'Create tasks':
                await this.createTasks();

                return this.index();
            case 'Monitors':
                new Monitors().index();

                break;
            case 'Utils':
                new Utils().index();

                break;
            case 'Back':
                return new Home().index();
        };
    }
};