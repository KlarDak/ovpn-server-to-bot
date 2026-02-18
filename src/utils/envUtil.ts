import dotenv from "dotenv";
dotenv.config();

/**
 * Get server properties from environment variables
 * @returns object - server properties
 */
export function serverProps(): any {
  // Hostname and port for the server to listen on, with defaults
  return {
    hostname: process.env.HOSTNAME ?? "0.0.0.0",
    port: Number(process.env.PORT) ?? 3000,
  };
}

/**
 * Returns secret key for encryption from environment variable
 * @returns object - secret key for encryption
 */
export function keyStats(): string {
  return process.env.SECRET_KEY ?? "default_key";
}

/**
 * Returns array of allowed IP addresses from environment variable
 * @returns array of allowed IP addresses from environment variable
 */
export function allowedIps(): string[] {
  return (process.env.ALLOWED_IPS ?? "")
    .split("|")
    .filter((ip) => ip.trim() !== "");
}

/**
 * Return paths for config, logs, users and user database from environment variables
 * @returns object - paths for config, logs, users and user database
 */
export function pathDirs(): any {
  return {
    configDir: process.env.CONFIG_DIR ?? "./tests/configs",
    logDir: process.env.LOG_DIR ?? "./tests/logs",
    usersDir: process.env.USERS_DIR ?? "./tests/usersconfigs",
    userDB: process.env.USER_DB ?? "./tests/users.db",
  };
}

/**
 * Return index of this server
 * @returns string - index of this server
 */
export function subIndex(): string {
  return process.env.SUB_INDEX ?? "ksd_nl_01";
}

/**
 * Return Redis connection properties from environment variables
 * @returns object - Redis connection properties
 */
export function redisPaths(): any {
  return {
    hostname: process.env.REDIS_HOSTNAME ?? "Redis-7.2",
    port: Number(process.env.REDIS_PORT) ?? 6379,
  };
}


/**
 * Return path to config script from environment variable
 * @returns string - path to config script
 */
export function configPath(): string {
  return process.env.CONFIG_SCRIPT ?? "script.sh";
}

/**
 * Return path to action script from environment variable
 * @returns string - path to action script
 */
export function actionPath(): string {
  return process.env.ACTION_SCRIPT ?? "script.sh";
}

/**
 * Return feedback webhook URL from environment variable
 * @returns string - feedback webhook URL
 */
export function feedbackWebhookUrl(): string {
  return process.env.FEEDBACK_WEBHOOK_URL ?? "https://example.com/webhook";
}
