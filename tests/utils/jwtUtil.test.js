import { describe, test, expect } from "vitest";
import { keyStats } from "../../src/utils/envUtil.js";
import { decodeToken, encodeToken, decryptToken, payloadGenerator, } from "../../src/utils/jwtUtil.js";
import { decrypt } from "dotenv";
const REALITY_SECRET = keyStats();
beforeEach(() => {
    process.env.SECRET_KEY = "11111111111111111111111111111111111";
});
afterEach(() => {
    process.env.SECRET_KEY = REALITY_SECRET;
});
describe("jwtUtil", () => {
    test("should generate a JWT token successfully", () => {
        const token = encodeToken("test-sub", "create", "admin");
        expect(token).toBeTruthy();
        expect(typeof token).toBe("string");
        expect(decodeToken(token)).toBeTruthy();
        expect(decryptToken(token)).toBeTruthy();
        expect(payloadGenerator("test-sub", "create", "admin")).toHaveProperty("sub", "test-sub");
        expect(payloadGenerator("test-sub", "create", "admin")).toHaveProperty("aud");
        expect(payloadGenerator("test-sub", "create", "admin")).toHaveProperty("iat");
        expect(payloadGenerator("test-sub", "create", "admin")).toHaveProperty("exp");
        expect(payloadGenerator("test-sub", "create", "admin")).toHaveProperty("role", "admin");
        expect(payloadGenerator("test-sub", "create", "admin")).toHaveProperty("type", "create");
    });
});
