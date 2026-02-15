export function serverProps(): any {
    return {
      hostname: process.env.HOSTNAME ?? "0.0.0.0",
      port: Number(process.env.PORT) ?? 3000,
    };
}

export function keyStats(): string {
    return process.env.SECRET_KEY ?? "default_key";
}

export function allowedIps(): string[] {
    return (process.env.ALLOWED_IPS ?? "").split("|").filter(ip => ip.trim() !== "");
}

export function pathDirs(): any {
    return {
        configDir: process.env.CONFIG_DIR ?? "./tests/configs",
        logDir: process.env.LOG_DIR ?? "./tests/logs",
        usersDir: process.env.USERS_DIR ?? "./tests/usersconfigs",
        userDB: process.env.USER_DB ?? "./tests/users.db",
    };
}

export function subIndex(): string {
    return process.env.SUB_INDEX ?? "ksd_nl_01";
}

export function redisPaths(): any {
    return {
        hostname: process.env.REDIS_HOSTNAME ?? "Redis-7.2",
        port: process.env.REDIS_PORT ?? 6379
    }
}

export function configPath(): string {
    return process.env.CONFIG_SCRIPT ?? "script.sh";
}

export function actionPath(): string {
    return process.env.ACTION_SCRIPT ?? "script.sh";
}

export function feedbackWebhookUrl(): string {
    return process.env.FEEDBACK_WEBHOOK_URL ?? "https://example.com/webhook";
}