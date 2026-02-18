import RedisUtil from "./redisUtil.js";
import { redisPaths } from './envUtil.js';

/**
 * Encode a new short link for the given UUID with the specified time-to-live (TTL) in seconds, and return the generated short link. If an error occurs during encoding, log the error and return false.
 * @param uuid - unique identifier to be associated with the generated short link
 * @param time - time-to-live (TTL) in seconds for the generated short link, after which it will expire and become invalid
 * @returns string | false - generated short link if encoding is successful, false otherwise
 */
export async function encodeLink(uuid: string, time: number): Promise<string | false> {
    const redisConnection = new RedisUtil(redisPaths().hostname, redisPaths().port);
    await redisConnection.connect();
    const linkCreated = generateSymbol(6); 

    const isSet = await redisConnection.set(`sl:${linkCreated}`, uuid, time);
    redisConnection.disconnect();

    if (isSet) {
        return linkCreated;
    }
    else {
        return false;
    }
}

/**
 * Decode the given short link and retrieve the associated UUID from the Redis database. If the short link is valid and the UUID is successfully retrieved, return the UUID. If the short link is invalid or an error occurs during decoding, log the error and return false.
 * @param slink - short link to be decoded and used for retrieving the associated UUID from the Redis database
 * @returns string | false - associated UUID if the short link is valid and retrieval is successful, false otherwise
 */
export async function decodeLink(slink: string): Promise<string | false> {
    const redisConnection = new RedisUtil(redisPaths().hostname, redisPaths().port);    
    await redisConnection.connect();

    const getLink = await redisConnection.get(`sl:${slink}`); 
    await redisConnection.disconnect();
    
    if (!getLink) {
        return false;
    }
    else {
        return getLink;
    }
}

/**
 * Generate a random alphanumeric string of the specified length, which can be used as a short link identifier. The generated string consists of uppercase letters, lowercase letters and digits, and is randomly generated using the Math.random() function.
 * @param length - length of the generated random alphanumeric string, which determines the number of characters in the generated short link identifier
 * @returns string - generated random alphanumeric string to be used as a short link identifier
 */
export function generateSymbol(length: number = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      result += chars[idx];
    }
    return result;
}