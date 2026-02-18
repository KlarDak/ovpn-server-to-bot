import jsonwebtoken from "jsonwebtoken";
import { keyStats, subIndex } from "./envUtil.js";
import { verifyPayloadKeys } from "./verifyUtil.js";
import type { ITokenConfig } from "../interfaces/ITokenConfig.js";

/**
 * Decrypt the given JWT token using the secret key from environment variable
 * @param token - JWT token to be decrypted
 * @returns object - decrypted token payload if successful, false otherwise
 */
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

/**
 * Decode the given JWT token and verify its payload keys
 * @param token - JWT token to be decoded
 * @returns object - decoded token payload if successful and valid, false otherwise
 */
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

/**
 * Encode a new JWT token with the given subject, type and role using the secret key from environment variable
 * @param sub - subject of the token, usually the index of server
 * @param type - type of the token, usually the action to be performed
 * @param role - role of the token, usually the permission level of the user
 * @returns string | false - JWT token if successful, false otherwise
 */
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

/**
 * Generate the payload for the JWT token with the given subject, type and role
 * @param sub - subject of the token, usually the index of server
 * @param type - type of the token, usually the action to be performed
 * @param role - role of the token, usually the permission level of the user
 * @returns object - payload for the JWT token
 */
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

/**
 * Extract the JWT token from the given authorization header by removing the "Bearer " prefix
 * @param auth_header - authorization header containing the JWT token in the format
 * @returns string | false - JWT token if successful, false otherwise
 */
export function getAuthToken(auth_header: string) : string | false {
    return auth_header.replace("Bearer ", "") ?? false;
}

export function getAuthParams(): any {}