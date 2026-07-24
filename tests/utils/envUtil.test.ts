import { afterEach, describe, test, expect } from "vitest";
import {
    allowedIps,
    configPath,
    keyStats,
    noRedisMode,
    noSQLiteMode,
    pathDirs,
    redisPaths,
    serverProps,
    subIndex,
} from "../../src/utils/envUtil.js";

const originalNoSql = process.env.NO_SQL;
const originalNoRedis = process.env.NO_REDIS;

describe("envUtil", () => {
    afterEach(() => {
        if (originalNoSql === undefined) {
            delete process.env.NO_SQL;
        } else {
            process.env.NO_SQL = originalNoSql;
        }

        if (originalNoRedis === undefined) {
            delete process.env.NO_REDIS;
        } else {
            process.env.NO_REDIS = originalNoRedis;
        }
    });

    test("Test serverProps environments", () => {
        expect(serverProps().hostname).not.toBeUndefined();
        expect(serverProps().port).not.toBeUndefined();
    });

    test("test keyStats environment", () => {
        expect(keyStats()).not.toBeUndefined();
    });

    test("test allowedIps environment", () => {
        expect(allowedIps()).not.toBeUndefined();
        expect(allowedIps()).toBeInstanceOf(Array);
    });

    test("test pathDirs environment", () => {
        expect(pathDirs().configDir).not.toBeUndefined();
        expect(pathDirs().logDir).not.toBeUndefined();
        expect(pathDirs().usersDir).not.toBeUndefined();
        expect(pathDirs().userDB).not.toBeUndefined();
    });

    test("test subIndex environment", () => {
        expect(subIndex()).not.toBeUndefined();
    });

    test("test redisPaths environment", () => {
        expect(redisPaths().hostname).not.toBeUndefined();
        expect(redisPaths().port).not.toBeUndefined();
    });

    test("test configPath environment", () => {
        expect(configPath()).not.toBeUndefined();
    });

    test("test actionPath environment", () => {
        expect(configPath()).not.toBeUndefined();
    });

    test("test feedbackWebhookUrl environment", () => {
        expect(configPath()).not.toBeUndefined();
    });

    test.each([
        ["true", true],
        ["TRUE", true],
        ["1", true],
        ["false", false],
        ["FALSE", false],
        ["0", false],
        ["", false],
    ])("parses NO_SQL=%s as %s", (value, expected) => {
        process.env.NO_SQL = value;
        expect(noSQLiteMode()).toBe(expected);
    });

    test("uses false when NO_SQL is not set", () => {
        delete process.env.NO_SQL;
        expect(noSQLiteMode()).toBe(false);
    });

    test("parses NO_REDIS independently", () => {
        process.env.NO_REDIS = "true";
        expect(noRedisMode()).toBe(true);

        process.env.NO_REDIS = "false";
        expect(noRedisMode()).toBe(false);
    });

    test("rejects invalid boolean values", () => {
        process.env.NO_SQL = "yes";
        expect(() => noSQLiteMode()).toThrow("Invalid boolean environment value");
    });
});
