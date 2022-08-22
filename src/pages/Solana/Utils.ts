import inquirer from "inquirer";
import 'colorts/lib/string';
import { Utils as Base } from "../../classes/pages/Solana/Utils";
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
                    'Solve civic on tasks wallets',
                    'Send all NFTs to wallet',
                    'Display all tokens in tasks wallets',
                    'Create wallets',
                    'Check tasks wallet funds',
                    'Check tasks format',
                    'Test RPC',
                    'Back'
                ]
            }
        ]);

        this.handleOption(prompt.choice);
    };

    public handleOption = async (option: string): Promise<void> => {
        switch (option) {
            case 'Send all NFTs to wallet':
                await this.transferAllNfts();

                return this.index();
            case 'Display all tokens in tasks wallets':
                await this.displayAllTokensInWallet();

                return this.index();
            case 'Create wallets':
                await this.createWallets();

                return this.index();
            case 'Check tasks wallet funds':
                await this.checkFunds();

                return this.index();
            case 'Check tasks format':
                await this.checkFormat();

                return this.index();
            case 'Solve civic on tasks wallets':
                await this.solveCivic();

                break;
            case 'Test RPC':
                await this.rpcTester();

                return this.index();
            case 'Back':
                return new Home().index();
        };
    };
};