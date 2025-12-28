import type { ITokenConfig } from "../interfaces/ITokenConfig.js";

export function verifyUuidFormat(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export function verifyPayloadKeys(payload: any): boolean {
    return payload as ITokenConfig ? true : false;
}

export function verifyRequiredFields(obj: any, requiredFields: string[]): boolean {
    for (const field of requiredFields) {
        if (!(field in obj)) {
            return false;
        }
    }

    return true;
}