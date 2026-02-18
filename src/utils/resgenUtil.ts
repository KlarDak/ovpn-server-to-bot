import type { IResponseConfig } from "../interfaces/IResponseConfig.js";

/**
 * Generate a standardized response object with the given status code, message and optional data, which can be used for API responses or other purposes.
 * @param code - status code of the response, usually an HTTP status code
 * @param message - message describing the response, usually a human-readable string
 * @param data - optional data to be included in the response, can be any type of data relevant to the response
 * @returns object - standardized response object containing the status code, message and optional data
 */
export function responseGenerator(code: number, message: string, data: any = null): IResponseConfig {
    return {code: code, data: data, message: message};
}

/**
 * Generate a standardized error response object with the given status code and message, which can be used for API error responses or other purposes.
 * @param code - status code of the error response, usually an HTTP status code
 * @param message - message describing the error response, usually a human-readable string
 * @return object - standardized error response object containing the status code and message
 */
export function consoleError(module: string, error: any): any {
    return `An error has occurred in module: "${module}", in time: ${new Date().toISOString()}. Error: ${error}`;
}