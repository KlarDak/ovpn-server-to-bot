import { describe, test, expect } from "vitest";
import { allowedIps, configPath, keyStats, pathDirs, redisPaths, serverProps, subIndex } from "../../src/utils/envUtil.js";
describe("envUtil", () => {
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
});
