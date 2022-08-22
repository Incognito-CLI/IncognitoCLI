import inquirer from "inquirer";
import CandyMachineMonitor from "../../../modules/Solana/monitors/CandyMachineMonitor";
import * as anchor from '@project-serum/anchor';
import { log } from "../../../utils/logger";
import { createPrompt, sleep } from "../../../utils/misc";
import LaunchpadMonitor from "../../../modules/Solana/monitors/LaunchpadMonitor";

export abstract class Monitors {
    abstract index(): Promise<void>;
    abstract handleOption(option: string): Promise<void>;

    public beginMonitor = async (type: string): Promise<void> => {
        try {
            const id = await createPrompt('input', 'Input candy machine id to monitor: ', false);

            const delay = await createPrompt('input', 'Input monitor delay: ', false);

            if (type == 'cm') {
                await new CandyMachineMonitor({
                    cmid: new anchor.web3.PublicKey(id.trim()),
                    delay: parseInt(delay.trim())
                }).monitor();
            } else if (type == 'me') {
                await new LaunchpadMonitor({
                    cmid: new anchor.web3.PublicKey(id.trim()),
                    delay: parseInt(delay.trim())
                }).monitor();
            };
        } catch (err: unknown) {
            log('error', 'Unknown error while monitoring!');

            await sleep(1500);

            return this.beginMonitor(type);
        };
    };
};