import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import type { ResponseData } from "../../constants/TLSInterface";
import { join } from "path";
import PubSub from "pubsub-js";
import getPort from "get-port";
const W3CWebSocket = require("websocket").w3cwebsocket;
import 'colorts/lib/string';

let child: ChildProcessWithoutNullStreams;

const cleanExit = async (message?: string | Error) => {
    if (!child) return;
    if (message) {
        console.log(message);
    }
    if (process.platform == "win32") {
        new Promise((resolve, reject) => {
            exec(
                "taskkill /pid " + child.pid + " /T /F",
                (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.warn(error);
                }
                process.exit();
                resolve(stdout ? stdout : stderr);
                }
            );
        });
    } else {
        new Promise((resolve, reject) => {
            if (child.pid) {
                process.kill(-child.pid);
                process.exit();
            }
        });
    }
};

process.on("SIGINT", () => cleanExit());

process.on("SIGTERM", () => cleanExit());

export let BACKEND: any
let PORT: number
export let CONNECTED = false

const connectToServer = async () => {
    try {
        await sleep(500)

        BACKEND = new W3CWebSocket(`ws://localhost:${PORT}/client`)

        BACKEND.onopen = function () {
            CONNECTED = true
        }

        BACKEND.onmessage = function (e: any) {
            if (typeof e.data === "string") {
                let responseData: ResponseData = JSON.parse(e.data);
                PubSub.publish(responseData.id, responseData);
            }
        }

        BACKEND.onclose = function () {
            console.log('Error using helper [1]'.red)
            CONNECTED = false
            connectToServer()
        }

        BACKEND.onerror = function () {
            console.log('Error using helper [2]'.red)
            CONNECTED = false
            connectToServer()
        }
    } catch (e) {}
}

export const startServer = async () => {
    try {
        PORT = await getPort()

        let executableFilename = "";
        if (process.platform == "win32") {
            executableFilename = "helper.exe";
        } else if (process.platform == "linux") {
            executableFilename = "helper-linux";
        } else if (process.platform == "darwin") {
            executableFilename = "helper";
        } else {
            throw new Error("Operating system not supported");
        }

        child = spawn(join(`"${process.cwd()}"`, `./${executableFilename}`), {
            env: { PROXY_PORT: PORT.toString() },
            shell: true,
            windowsHide: true,
            detached: process.platform !== "win32",
        });

        await connectToServer()
    } catch (e) {
        console.log("Error (HELPER NOT FOUND) ask for help in incognito.".red);
        await sleep(2500);
        process.exit(3);
    }
}


const dir = "/";

export function getBaseUrl(url: string, prefix?: string) {
    const urlAsArray = url.split(dir);
    const doubleSlashIndex = url.indexOf("://");
    if (doubleSlashIndex !== -1 && doubleSlashIndex === url.indexOf(dir) - 1) {
        urlAsArray.length = 3;
        let url = urlAsArray.join(dir);
        if (prefix !== undefined) url = url.replace(/http:\/\/|https:\/\//, prefix);
        return url;
    } else {
        let pointIndex = url.indexOf(".");
        if (pointIndex !== -1 && pointIndex !== 0) {
            return (prefix !== undefined ? prefix : "https://") + urlAsArray[0];
        }
    }
    return "";
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}