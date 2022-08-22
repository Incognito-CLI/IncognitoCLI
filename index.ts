import fs from 'fs';
import 'colorts/lib/string';
import Package from './package.json';
import cliProgress from 'cli-progress';
import { PATHS } from './src/constants/paths';
import { sleep } from './src/utils/misc';
import { log, title } from './src/utils/logger';
import Home from './src/pages/Home';
import { Server } from './src/utils/TLS/GotTLS';
import { Authenticate } from './src/utils/Authentication/Login';

Server.connect();

const version: string = Package.version;

interface Config {
    capmonsterKey: string;
    rpc: string;
    key: string;
    alchemyKey: string;
    etherscanKey: string;
};

class Main {
    private directory(): void {
        const defaultConfig: Config = {
            "capmonsterKey": "",
            "rpc": "",
            "key": "",
            "alchemyKey": "",
            "etherscanKey": "",
        };

        if (!fs.existsSync(PATHS.config)) {
            log('misc', `Creating config file in ${PATHS.config}`);

            try {
                fs.writeFileSync(PATHS.config, JSON.stringify(defaultConfig, null, 4), 'utf-8');

                return;
            } catch (err: unknown) {
                log('error', 'Unknown error while creating config file!');

                return;
            };
        } else {
            return;
        };
    };

    private makeCoolLoader = async (): Promise<void> => {
        try {
            let value: number = 0;

            const bar: cliProgress.Bar = new cliProgress.Bar({
                stopOnComplete: true,
                format: 'Progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
                barsize: 65,
            }, cliProgress.Presets.shades_grey);

            bar.start(Math.floor(Math.random() * (500 - 250 + 1) + 250), 0);

            const timer = await setInterval(async () => {
                value += 3;

                bar.update(value);

                if (value >= bar.getTotal()) {
                    clearInterval(timer);

                    await sleep(500);

                    await this.readFiles();
                };
            }, 0.25);

            return;
        } catch (err: unknown) {
            log('error', 'Unknown error while loading files!');

            await sleep(2500);

            process.exit();
        };
    };

    private readFiles = async (): Promise<void> => {
        try {
            let x: number = 0;
            let config: boolean = false;

            const files: string[] = fs.readdirSync(process.cwd());

            for (let y = 0; y < files.length; y++) {
                if (files[y].endsWith('csv')) {
                    x++;
                } else if (files[y].endsWith('json') && files[y].includes('incognitoConfig')) {
                    config = true;
                };
            };

            log('misc', `${x} csv file(s) detected!`);

            config ? log('misc', 'Detected JSON config file!') : await this.directory();

            return this.auth();
        } catch (err: unknown) {
            log('error', 'Unknown error while detecting files!');

            await sleep(2500);

            process.exit();
        };
    };

    private auth = async (): Promise<void> => {
        // const response = await Authenticate();

        const response = "good";

        if (response.slice(0, 4) == "good") {
            log('welcome', `Welcome back, ${response.slice(4, response.length)}.`);

            await sleep(2500);

            return new Home().index();
        } else {
            log('error', `Invalid Login!`);

            await sleep(2500);

            process.exit();
        };
    };

    public start = async (): Promise<void> => {
        title(`Incognito CLI - Version ${version} - Authorization`);

        console.clear();

        log('title');

        this.directory();

        log('loading');

        await this.makeCoolLoader();
    };
};

new Main().start();