import { sleep, getBaseUrl, startServer, CONNECTED, BACKEND } from "./GotMain";
import type {
    RequestOptions,
    ResponseData,
    RequestData,
    PromiseCookieJar,
} from "../../constants/TLSInterface";
import { EventEmitter } from "events";
import { FormDataEncoder, isFormDataLike } from "form-data-encoder";
import { v4 as uuidv4 } from "uuid";
import PubSub from "pubsub-js";
import { URLSearchParams } from "url";

export const Server = {
    connect: startServer,
};

const validMethods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "HEAD",
    "DELETE",
    "OPTIONS",
    "TRACE",
    "get",
    "post",
    "put",
    "patch",
    "head",
    "delete",
    "options",
    "trace",
];

export const got = async (
    method: string,
    url: string,
    options: RequestOptions,
    responseEmitter: EventEmitter | null = null,
    redirects: number = 0
) => {
    method = method.toUpperCase();

    let init = false;

    if (!responseEmitter) {
        init = true;
        responseEmitter = new EventEmitter();
    }

    let timeWaited = 0;

    while (!CONNECTED) {
        (await sleep(100)) && (timeWaited += 100);
        if (timeWaited > 10000) {
            responseEmitter.emit("error", `Proxy Client Took Too Long To Connect!`);
        }
    }

    if (!validMethods.includes(method)) {
        responseEmitter.emit("error", `Request Method ${method} Is Not Supported`);
    }

    if (typeof url === "string" && url === "") {
        responseEmitter.emit("error", `Request Url ${url} Is Not Valid`);
    }

    if (!url.includes("https://") && !url.includes("http://")) {
        responseEmitter.emit(
            "error",
            `Request Protocol Not Found! e.g http:// https://`
        );
    }

    let baseUrl = getBaseUrl(url);

    if (options.cookieJar && typeof baseUrl === "string" && baseUrl === "") {
        responseEmitter.emit(
            "error",
            `Cookie Domain Cannot Be Resolved With Url ${url}`
        );
    }

    const id = uuidv4();

    let request: RequestData = {
        id: id,
        method: method,
        url: url,
        headers: options.headers,
        debug: options.debug,
    };

    let hasContentType =
        options.headers["content-type"] || options.headers["Content-Type"];

    if (options.json) {
        if (!hasContentType) {
            options.headers["content-type"] = "application/json";
        }
        request.body = JSON.stringify(options.json);
    } else if (options.body) {
        if (isFormDataLike(options.body)) {
            const encoder = new FormDataEncoder(options.body);
            if (!hasContentType) {
                options.headers["content-type"] = encoder.headers["Content-Type"];
            }
            request.body = encoder.encode().toString();
            } else {
            request.body = options.body
        }
    } else if (options.form) {
        if (!hasContentType) {
        options.headers["content-type"] = "application/x-www-form-urlencoded";
        }
        request.body = new URLSearchParams(
        options.form as Record<string, string>
        ).toString();
    }

    if (options.redirect) {
        request.redirect = options.redirect;
    }

    if (options.timeout) {
        request.timeout = options.timeout;
    }

    if (options.proxy) {
        request.proxy = options.proxy;
    }

    if (options.cookieJar) {
        const cookieString: string = await options.cookieJar.getCookieString(
        baseUrl
        );
        if (cookieString != "") {
        request.headers.cookie = cookieString;
        }
    }

    PubSub.subscribe(id, async (msg: any, data: ResponseData) => {
        if (data.success) {
        if (data.headers) {
            let finalHeaders: { [key: string]: string } = {};

            for (const header in data.headers) {
            if (
                header === "Set-Cookie" &&
                typeof data.headers["Set-Cookie"] === "object" &&
                Array.isArray(data.headers["Set-Cookie"])
            ) {
                if (options.cookieJar) {
                let promises: Array<Promise<unknown>> = data.headers[
                    "Set-Cookie"
                ].map(async (rawCookie: string) =>
                    (options.cookieJar as PromiseCookieJar).setCookie(
                    rawCookie,
                    url!.toString()
                    )
                );
                try {
                    await Promise.all(promises);
                } catch (error: any) {}
                }
                finalHeaders["Set-Cookie"] = data.headers["Set-Cookie"].join(", ");
            } else {
                finalHeaders[header] = data.headers[header][0];
            }
            }
            data.headers = finalHeaders;
        }

        if (
            data.statusCode >= 300 &&
            data.statusCode < 400 &&
            data.headers["Location"]
        ) {
            responseEmitter?.emit("redirect", data.headers["Location"]);
        } else {
            responseEmitter?.emit("end", data);
        }
        } else {
        responseEmitter?.emit("error", data.message);
        }
    });

    BACKEND.send(JSON.stringify(request));

    responseEmitter.on("redirect", async (data) => {
        redirects = redirects + 1;
        if (redirects >= 20) {
            responseEmitter?.emit("error", "Too Many Redirects Error");
        } else {
        options.body = undefined
        options.json = undefined
        options.form = undefined
        got("GET", data, options, responseEmitter, redirects);
        }
    });

    if (init) {
        return new Promise<ResponseData>((resolve, reject) => {
        responseEmitter?.on("end", (data: ResponseData) => {
            PubSub.unsubscribe(data.id);
            resolve(data);
        });
        responseEmitter?.on("error", (err) => {
            reject(new Error(err));
        });
        });
    } else {
        return <ResponseData>{
        id: "",
        method: "",
        statusCode: 0,
        url: "",
        headers: {},
        body: "",
        success: false,
        message: "",
        };
    }
};

got.head = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("head", url, options);
};
got.get = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("get", url, options);
};
got.post = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("post", url, options);
};
got.put = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("put", url, options);
};
got.delete = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("delete", url, options);
};
got.trace = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("trace", url, options);
};
got.options = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("options", url, options);
};
got.connect = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("options", url, options);
};
got.patch = (url: string, options: RequestOptions): Promise<ResponseData> => {
    return got("patch", url, options);
};