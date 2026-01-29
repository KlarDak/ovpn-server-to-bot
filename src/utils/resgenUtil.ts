import type { IResponseConfig } from "../interfaces/IResponseConfig.js";

export function responseGenerator(code: number, message: string, data: any = null): IResponseConfig {
    return {code: code, data: data, message: message};
}

export function consoleError(module: string, error: any): any {
    return `An error has occurred in module: "${module}", in time: ${new Date().toISOString()}. Error: ${error}`;
}