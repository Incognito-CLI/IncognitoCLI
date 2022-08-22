import { sleep } from "../../../utils/misc";

export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

export async function endlessRetry<T>(
    call: () => Promise<T>
): Promise<T> {
    let result: T | undefined;
    while (result == undefined) {
        try {
            result = await call();
        } catch (err) {
            await sleep(1000);
        }
    }
    return result;
};