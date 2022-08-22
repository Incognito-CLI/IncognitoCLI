import inquirer from 'inquirer';
import Paras from '../../../modules/NEAR/Paras';
import { log } from '../../../utils/logger';
import { createPrompt, sleep } from '../../../utils/misc';
import Contract from '../../../modules/NEAR/Contract';
import CsvReader from '../../csvReader';

export abstract class NEAR {
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
                        'Contract',
                        'Paras',
                        'Back'
                    ]
                }
            ]);

            const privateKey = await createPrompt('password', 'Input wallet private key: ', true);

            const monitorInput = await createPrompt('input', 'Input monitor input: ', false);

            const accountName = await createPrompt('input', 'Input account name: ', false);

            const price = await createPrompt('input', 'Input price: ', false);

            const amount = await createPrompt('input', 'Input amount of tasks to save: ', false);

            const file = await createPrompt('input', 'Input name for csv file: ', false);

            if (!privateKey || !monitorInput || !accountName || !price || !file) {
                log('error', 'One or more inputs are blank!');

                await sleep(2500);

                return;
            };
            
            await new CsvReader({ path: `${process.cwd()}\\${file}` }).writeNEARTasks(parseInt(amount.trim()), [ mode.choice.trim(), privateKey.trim(), monitorInput.trim(), accountName.trim(), price.trim() ]);

            await sleep(2500);

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while creating tasks!');

            await sleep(2500);

            return;
        };
    };

    public startTasks = async (): Promise<void> => {
        try {
            await inquirer.prompt([
                {
                    type: 'file-tree-selection',
                    name: 'path'
                }
            ]).then(async (answers: { path: string }) => {
                if (answers.path.endsWith('csv')) {
                    const parser: CsvReader = new CsvReader(answers);

                    const tasks: {
                        mode: string;
                        privateKey: string;
                        monitorInput: string;
                        accountName: string;
                        price: string;
                    }[] = await parser.returnNEARTasks();

                    tasks.forEach(async (task: {
                        mode: string;
                        privateKey: string;
                        monitorInput: string;
                        accountName: string;
                        price: string;
                    }): Promise<void> => {
                        if (task.mode = "Paras") {
                            await new Paras(task).start();
                        } else {
                            await new Contract(task).mint();
                        }
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
    }
};