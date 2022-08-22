import inquirer from "inquirer";
import 'colorts/lib/string';
import { NEAR as Base } from "../../classes/pages/NEAR/NEAR";
import { log, title } from "../../utils/logger";
import Package from '../../../package.json';
import Home from "../Home";
import Utils from "./Utils";

const version: string = Package.version;

export default class NEAR extends Base {
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
            case 'Utils':
                await new Utils().index();

                break;
            case 'Run all tasks':
                await this.startTasks();

                break;
            case 'Create tasks':
                await this.createTasks();

                return this.index();
            case 'Back':
                return new Home().index();
        };
    }
};