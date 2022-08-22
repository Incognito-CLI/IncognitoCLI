import inquirer from "inquirer";
import { log, title } from "../../utils/logger";
import fs from 'fs';
import { returnConfig, sleep } from "../../utils/misc";
import Package from '../../../package.json';
import { PATHS } from "../../constants/paths";

const version: string = Package.version;

export abstract class Settings {
    abstract index(): Promise<void>;
    abstract handleOption(option: string): Promise<void>;

    public setSetting = async (titleName: string, setting: string, message: string, successMessage: string): Promise<boolean> => {
        try {
            const config: string = returnConfig();
            const update = JSON.parse(config);
    
            title(`Incognito CLI - Version ${version} - Settings - ${titleName}`);
    
            const key: { input: string } = await inquirer.prompt([
                {
                    name: 'input',
                    type: 'input',
                    message: `${message} (blank input to go back): `.cyan,
                }
            ]);
    
            if (!key.input) {
                return false;
            };
    
            update[`${setting}`] = key.input.trim();
    
            fs.writeFileSync(PATHS.config, JSON.stringify(update, null, 4), 'utf-8')
    
            log('success', `${successMessage}`);
    
            await sleep(2500);
    
            return true;
        } catch (err: unknown) {
            log('error', 'An unknown error has occurred!');

            await sleep(2500);

            return false;
        };
    };
};