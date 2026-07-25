import { describe, test, expect } from "vitest";
import { configFiles } from "../../src/utils/configUtil.js";
import SQLiteClient from "../../src/utils/sqliteUtil.js";
describe("configFiles", () => {
    test("should create connection to SQLite database", () => {
        const connection = configFiles.userDB;
        expect(connection).toBeInstanceOf(SQLiteClient);
    });
    test("should create a user config successfully", () => {
        const uuid = "test-uuid";
        const type = "user";
        const time = 3600;
        expect(configFiles.create(uuid, type, time)).toBe(true);
    });
    test("should get a user config successfully", async () => {
        const uuid = "test-uuid";
        const userConfig = await configFiles.get(uuid);
        expect(userConfig).toHaveProperty("uuid", uuid);
        expect(userConfig).toHaveProperty("user_type", "user");
        expect(userConfig).toHaveProperty("created_at");
        expect(userConfig).toHaveProperty("expired_time");
        expect(userConfig).toHaveProperty("status", "active");
    });
    test("should update a user config successfully", async () => {
        const uuid = "test-uuid";
        const user_type = "admin";
        const time = 7200;
        expect(await configFiles.update(uuid, time, user_type)).toBe(true);
    });
    test("should get a user config successfully", async () => {
        const uuid = "test-uuid";
        const userConfig = await configFiles.get(uuid);
        expect(userConfig).toHaveProperty("uuid", uuid);
        expect(userConfig).toHaveProperty("user_type", "admin");
        expect(userConfig).toHaveProperty("created_at");
        expect(userConfig).toHaveProperty("expired_time");
        expect(userConfig).toHaveProperty("status", "active");
    });
    test("should delete a user config successfully", async () => {
        const uuid = "test-uuid";
        expect(await configFiles.delete(uuid)).toBe(true);
    });
});
