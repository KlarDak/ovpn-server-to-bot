import { createClient, type RedisClientType } from "redis";
import { consoleError } from "./resgenUtil.js";

class RedisUtil {
    private redisConn: RedisClientType;
    private isConnect: boolean = false;

    constructor(hostname: string, port: number) {
        this.redisConn = createClient({
            url: `redis://${hostname}:${port}`,
            socket: {
                connectTimeout: 3000,
                keepAlive: false,
                reconnectStrategy: false
            }
        });

        this.redisConn.on("error", (error) => {
            console.error(`Redis connection has been destroyed in ${new Date(Date.now()).toISOString()}: `, error);
        });

        this.redisConn.on("connection", () => {
            this.isConnect = true;
        });
    }

    async connect(): Promise<RedisClientType | false> {
        try {
            if (!this.isConnect) {
                return await this.redisConn.connect();
            }
            else {
                return false;
            }
        }
        catch(error: any) {
            console.error(consoleError("Redis-connect", error));
            return false;
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.redisConn.get(key);
        }
        catch(error: any) {
            console.error(consoleError("Redis-get", error));
            return null;
        }
    }

    async set(key: string, value: string, ttl?: number): Promise<boolean> {
        try {
            if (!ttl) {
                return (await this.redisConn.set(key, value) === "OK") ? true : false;
            }
            else {
                return (await this.redisConn.set(key, value, { EX: ttl }) === "OK") ? true : false;
            }
        }
        catch(error: any) {
            console.error(consoleError("Redis-set", error));
            return false;
        }
    }

    async del(key: string): Promise<number> {
        try {
            return await this.redisConn.del(key) ?? false;
        }
        catch(error: any) {
            console.error(consoleError("Redis-del", error));
            return 0;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            return await (this.redisConn.exists(key)) ? true : false;
        }
        catch(error: any) {
            console.error(consoleError("Redis-del", error));
            return false;
        }
    }

    async disconnect(): Promise<string | false> {
        try {
            if (this.isConnect) {
                return await this.redisConn.quit();
            }
            else {
                return false;
            }
        }
        catch(error: any) {
            console.error(consoleError("Redis-disconnect", error));
            return false;
        }
    }
}

export default RedisUtil;