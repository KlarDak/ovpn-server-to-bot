import RedisUtil from "./redisUtil.js";
import { redisPaths } from './envUtil.js';

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

export function generateSymbol(length: number = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      result += chars[idx];
    }
    return result;
}