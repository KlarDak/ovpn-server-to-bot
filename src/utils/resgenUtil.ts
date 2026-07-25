import type { IResponseConfig } from "../interfaces/IResponseArray.js";

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