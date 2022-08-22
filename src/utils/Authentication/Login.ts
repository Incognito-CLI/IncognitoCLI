import inquirer from "inquirer";
import { log } from '../logger';
import 'colorts/lib/string';
import { sleep, getIP } from '../misc';
import fs from 'fs';
import got from 'got';
import { Decrypt, DecodeCipher } from './Decipher';
import { PATHS } from "../../constants/paths";

export const Authenticate = async (): Promise<string> => {
    let config: any = fs.readFileSync(PATHS.config, 'utf-8');
    let update = JSON.parse(config);
    let status;

    let publicIP;
    try {
        publicIP = await getIP();
    } catch (err: unknown) {
        return "bad";
    }
    
    if (update["key"] == "") {
        const key: { input: string } = await inquirer.prompt([
            {
                name: 'input',
                type: 'input',
                message: 'Input your key: '.magenta
            }
        ]);

        update["key"] = key.input;

        fs.writeFileSync(PATHS.config, JSON.stringify(update, null, 4), 'utf-8');    
        
        const date = new Date();

        status = checkKey(JSON.parse(publicIP).ip, key.input, date);
    } else {
        const date = new Date();

        status = checkKey(JSON.parse(publicIP).ip, update["key"], date);
    }

    return status;
};

async function checkKey(publicip: any, key: string, date: any) {
    try {
        // Removed for privacy
        const response = await got("http://:7777/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "ip": publicip,
                "key": Buffer.from(key).toString("base64"),
                "time": date.getTime(),
            })
        });

        if (JSON.parse(response.body)['version'] != 'v1.5.16') {
            log('error', `Version not up to date, please update to ${JSON.parse(response.body).version}!`);
            await sleep(2500);
            return "bad"
        } else if (DecodeCipher(Buffer.from(DecodeCipher(Decrypt(JSON.parse(response.body).l), date.getTime() % 10), "base64").toString("ascii").substring(0, 24), date.getTime() % 10) == key && JSON.parse(response.body).version == "v1.5.16") {
            return `good${JSON.parse(response.body).u}`
        }

        throw "Error checking key"
    } catch (err) {
        log('error', `Error checking key!`);
        await sleep(2500);
        return "bad"
    }
}