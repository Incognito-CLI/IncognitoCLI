import isAdmin from 'admin-check';
import { getTime } from './misc';
import chalk from 'chalk';

let admin: boolean;

export const checkAdmin = async (): Promise<void> => {
    await isAdmin.check().then((result: boolean): void => {
        admin = result;
    });
};

export const log = (type: string, message?: string): void => {
    if (type == 'title') {
        console.log(chalk.cyan(
            `
             ██▓ ███▄    █  ▄████▄   ▒█████    ▄████  ███▄    █  ██▓▄▄▄█████▓ ▒█████      ▄████▄   ██▓     ██▓
             ▓██▒ ██ ▀█   █ ▒██▀ ▀█  ▒██▒  ██▒ ██▒ ▀█▒ ██ ▀█   █ ▓██▒▓  ██▒ ▓▒▒██▒  ██▒   ▒██▀ ▀█  ▓██▒    ▓██▒
             ▒██▒▓██  ▀█ ██▒▒▓█    ▄ ▒██░  ██▒▒██░▄▄▄░▓██  ▀█ ██▒▒██▒▒ ▓██░ ▒░▒██░  ██▒   ▒▓█    ▄ ▒██░    ▒██▒
             ░██░▓██▒  ▐▌██▒▒▓▓▄ ▄██▒▒██   ██░░▓█  ██▓▓██▒  ▐▌██▒░██░░ ▓██▓ ░ ▒██   ██░   ▒▓▓▄ ▄██▒▒██░    ░██░
             ░██░▒██░   ▓██░▒ ▓███▀ ░░ ████▓▒░░▒▓███▀▒▒██░   ▓██░░██░  ▒██▒ ░ ░ ████▓▒░   ▒ ▓███▀ ░░██████▒░██░
             ░▓  ░ ▒░   ▒ ▒ ░ ░▒ ▒  ░░ ▒░▒░▒░  ░▒   ▒ ░ ▒░   ▒ ▒ ░▓    ▒ ░░   ░ ▒░▒░▒░    ░ ░▒ ▒  ░░ ▒░▓  ░░▓  
              ▒ ░░ ░░   ░ ▒░  ░  ▒     ░ ▒ ▒░   ░   ░ ░ ░░   ░ ▒░ ▒ ░    ░      ░ ▒ ▒░      ░  ▒   ░ ░ ▒  ░ ▒ ░
              ▒ ░   ░   ░ ░ ░        ░ ░ ░ ▒  ░ ░   ░    ░   ░ ░  ▒ ░  ░      ░ ░ ░ ▒     ░          ░ ░    ▒ ░
              ░           ░ ░ ░          ░ ░        ░          ░  ░               ░ ░     ░ ░          ░  ░ ░  
                            ░                                                             ░                     
            \n`)
        );
    } else if (type == 'loading') {
        console.log(chalk.magenta(`[${getTime()}] - [INCOGNITO]${admin ? ' - [ADMIN] - ' : ' - '}[MESSAGE] - Loading files...\n`));
    } else if (type == 'error') {
        console.log(chalk.red(`[${getTime()}] - [INCOGNITO]${admin ? ' - [ADMIN] - ' : ' - '}[MESSAGE] - ${message}`));
    } else if (type == 'misc') {
        console.log(chalk.cyan(`[${getTime()}] - [INCOGNITO]${admin ? ' - [ADMIN] - ' : ' - '}[MESSAGE] - ${message}`));
    } else if (type == 'welcome') {
        console.log(chalk.green(`[${getTime()}] - [INCOGNITO]${admin ? ' - [ADMIN] - ' : ' - '}[AUTH] - ${message}`));
    } else if (type == 'success') {
        console.log(chalk.green(`[${getTime()}] - [INCOGNITO]${admin ? ' - [ADMIN] - ' : ' - '}[MESSAGE] - ${message}`));
    } else if (type == 'submit') {
        console.log(chalk.magenta(`[${getTime()}] - [INCOGNITO]${admin ? ' - [ADMIN] - ' : ' - '}[MESSAGE] - ${message}`));
    }
};

export const title = (title: string): void => {
    if (process.platform == 'win32') {
        process.title = title;
    } else {
        process.stdout.write('\x1b]2;' + title + '\x1b\x5c');
    };
};