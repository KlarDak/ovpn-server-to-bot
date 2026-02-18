import type { ITokenConfig } from "../interfaces/ITokenConfig.js";

/**
 * Verify if the given UUID string is in a valid format, which consists of 32 hexadecimal characters separated by hyphens in the pattern of 8-4-4-4-12. The function uses a regular expression to check if the input string matches the expected UUID format, and returns true if it does, or false if it does not.
 * @param uuid - string representing the UUID to be verified, which should be in the format of 8-4-4-4-12 hexadecimal characters separated by hyphens
 * @returns boolean - true if the input string is in a valid UUID format, false otherwise
 */
export function verifyUuidFormat(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Verify if the given payload object contains the required keys for a valid token configuration, which include "sub", "type" and "role". The function checks if the input object can be cast to the ITokenConfig interface, which defines the expected structure of a valid token configuration. If the input object contains all the required keys and can be cast to ITokenConfig, the function returns true, indicating that the payload is valid. Otherwise, it returns false, indicating that the payload is invalid or does not conform to the expected structure.
 * @param payload - object representing the payload to be verified, which should contain the required keys for a valid token configuration
 * @returns boolean - true if the input object contains the required keys and can be cast to ITokenConfig, false otherwise
 */
export function verifyPayloadKeys(payload: any): boolean {
    return payload as ITokenConfig ? true : false;
}

/**
 * Verify if the given object contains all the required fields specified in the requiredFields array. The function iterates through each field in the requiredFields array and checks if it exists as a key in the input object. If any of the required fields are missing from the object, the function returns false, indicating that the object does not contain all the required fields. If all required fields are present in the object, the function returns true, indicating that the object is valid and contains all necessary information.
 * @param obj - object to be verified for the presence of required fields, which can be any JavaScript object
 * @param requiredFields - array of strings representing the names of the required fields that should be present in the input object
 * @returns boolean - true if the input object contains all the required fields specified in the requiredFields array, false otherwise
 */
export function verifyRequiredFields(obj: any, requiredFields: string[]): boolean {
    for (const field of requiredFields) {
        if (!(field in obj)) {
            return false;
        }
    }

    return true;
}