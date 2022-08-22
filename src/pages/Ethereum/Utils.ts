import inquirer from "inquirer";
import 'colorts/lib/string';
import { Utils as Base } from "../../classes/pages/Ethereum/Utils";
import { log, title } from "../../utils/logger";
import Package from '../../../package.json';
import Home from "../Home";

const version: string = Package.version;

export default class Utils extends Base {
    public index = async (): Promise<void> => {
        console.clear();

        title(`Incognito CLI - Version ${version} - Utils`);

        log('title');

        const prompt: { choice: string } = await inquirer.prompt([
            {
                name: 'choice',
                type: 'list',
                message: 'What would you like to do?'.magenta,
                choices: [
                    'Check tasks wallet funds',
                    'Back'
                ]
            }
        ]);

        this.handleOption(prompt.choice);
    };

    public handleOption = async (option: string): Promise<void> => {
        switch (option) {
            case 'Check tasks wallet funds':
                await this.checkFunds();

                break;
            case 'Back':
                return new Home().index();
        };

        return this.index();
    }
};