import jsonwebtoken from "jsonwebtoken";
import { keyStats, subIndex } from "./envUtil.js";
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

export function encodeToken(sub: string, type: string, role: string): string | false {
    try {
        const token = jsonwebtoken.sign(payloadGenerator(sub, type, role), keyStats(), { expiresIn: "12s" });
        return token;
    }
    catch (error) {
        console.error("An error has been occurred during token encoding:", error);
        return false;
    }
}

export function payloadGenerator(sub: string, type: string, role: string): ITokenConfig {
    return {
      sub: sub,
      aud: subIndex(),
      iat: Date.now(),
      exp: Date.now() + 12000,
      role: role as "admin" | "user" | "guest" | "bot",
      type: type as "create" | "recreate" | "update" | "delete" | "get" | "active",
    };
}

export function getAuthToken(auth_header: string) : string | false {
    return auth_header.replace("Bearer ", "") ?? false;
}

export function getAuthParams(): any {}