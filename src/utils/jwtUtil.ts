import jsonwebtoken from "jsonwebtoken";
import { keyStats } from "./envUtil.js";
import { verifyPayloadKeys } from "./verifyUtil.js";
import type { ITokenConfig } from "../interfaces/ITokenConfig.js";

export function decryptToken(token: string): any {
    try {
        const decoded = jsonwebtoken.verify(token, keyStats());
        return decoded;
    }
    catch (error) {
        console.log("An error has been occurred during token decryption:", error);
        return false;
    }
}

export function decodeToken(token: string): any {
    try {
        const decodedToken = decryptToken(getAuthToken(token) as string);

        if (!decodedToken || !verifyPayloadKeys(decodedToken)) {
            return false;
        }

        return (decodedToken as ITokenConfig);
    }
    catch (error) {
        console.error("An error has been occurred during token decoding:", error);
        return false;
    }
}

export function getAuthToken(auth_header: string) : string | false {
    return auth_header.replace("Bearer ", "") ?? false;
}

export function getAuthParams(): any {}