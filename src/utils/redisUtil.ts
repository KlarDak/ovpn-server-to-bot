import { createClient, type RedisClientType } from "redis";
import { consoleError } from "./resgenUtil.js";

/**
 * RedisUtil class provides methods to interact with Redis database, including connecting, pinging, getting, setting, deleting keys and disconnecting from the database.
 */
class RedisUtil {
  private redisConn: RedisClientType;
  private isConnect: boolean = false;

  /**
   * Create a new RedisUtil instance with the given hostname and port, and initialize the Redis connection with the specified options. Also, set up event listeners for error and connection events to handle connection status and errors.
   * @param hostname - hostname of the Redis server, obtained from environment variable or default value
   * @param port - port of the Redis server, obtained from environment variable or default value
   */
  constructor(hostname: string, port: number) {
    this.redisConn = createClient({
      url: `redis://${hostname}:${port}`,
      socket: {
        connectTimeout: 3000,
        keepAlive: false,
        reconnectStrategy: false,
      },
    });

    this.redisConn.on("error", (error) => {
      console.error(
        `Redis connection has been destroyed in ${new Date(Date.now()).toISOString()}: `,
        error,
      );
    });

    this.redisConn.on("connection", () => {
      this.isConnect = true;
    });
  }

  /**
   * Connect to the Redis server if not already connected, and return the Redis client instance. If already connected, return false. If an error occurs during connection, log the error and return false.
   * @returns RedisClientType | false - Redis client instance if connection is successful, false otherwise
   */
  async connect(): Promise<RedisClientType | false> {
    try {
      if (!this.isConnect) {
        return await this.redisConn.connect();
      } else {
        return false;
      }
    } catch (error: any) {
      console.error(consoleError("Redis-connect", error));
      return false;
    }
  }

  /**
   * Ping the Redis server to check if the connection is alive, and return the response. If an error occurs during pinging, log the error and return false.
   * @returns string | false - response from the Redis server if ping is successful, false otherwise
   */
  async ping(): Promise<string | false> {
    try {
      return await this.redisConn.ping();
    } catch (error: any) {
      console.error(consoleError("Redis-ping", error));
      return false;
    }
  }

  /**
   * Get the value of the specified key from the Redis database, and return it. If an error occurs during getting the key, log the error and return null.
   * @param key - key to be retrieved from the Redis database
   * @returns string | null - value of the specified key if retrieval is successful, null otherwise
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redisConn.get(key);
    } catch (error: any) {
      console.error(consoleError("Redis-get", error));
      return null;
    }
  }

  /**
   * Set the value of the specified key in the Redis database with an optional time-to-live (TTL) in seconds, and return true if the operation is successful. If an error occurs during setting the key, log the error and return false.
   * @param key - key to be set in the Redis database
   * @param value - value to be set for the specified key in the Redis database
   * @param ttl - optional time-to-live (TTL) in seconds for the specified key in the Redis database
   * @returns boolean - true if the key is set successfully, false otherwise
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!ttl) {
        return (await this.redisConn.set(key, value)) === "OK" ? true : false;
      } else {
        return (await this.redisConn.set(key, value, { EX: ttl })) === "OK"
          ? true
          : false;
      }
    } catch (error: any) {
      console.error(consoleError("Redis-set", error));
      return false;
    }
  }

  /**
   * Delete the specified key from the Redis database, and return the number of keys that were deleted. If an error occurs during deleting the key, log the error and return 0.
   * @param key - key to be deleted from the Redis database
   * @returns number - number of keys that were deleted if deletion is successful, 0 otherwise
   */
  async del(key: string): Promise<number> {
    try {
      return (await this.redisConn.del(key)) ?? false;
    } catch (error: any) {
      console.error(consoleError("Redis-del", error));
      return 0;
    }
  }

  /**
   * Check if the specified key exists in the Redis database, and return true if it exists, false otherwise. If an error occurs during checking the key, log the error and return false.
   * @param key - key to be checked for existence in the Redis database
   * @returns boolean - true if the key exists in the Redis database, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redisConn.exists(key)) ? true : false;
    } catch (error: any) {
      console.error(consoleError("Redis-del", error));
      return false;
    }
  }

  /**
   * Disconnect from the Redis server if currently connected, and return the response from the quit command. If not currently connected, return false. If an error occurs during disconnecting, log the error and return false.
   * @returns string | false - response from the quit command if disconnection is successful, false otherwise
   */
  async disconnect(): Promise<string | false> {
    try {
      if (this.isConnect) {
        return await this.redisConn.quit();
      } else {
        return false;
      }
    } catch (error: any) {
      console.error(consoleError("Redis-disconnect", error));
      return false;
    }
  }
}

export default RedisUtil;
