import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  decodeToken,
  decryptToken,
  encodeToken,
  getAuthToken,
  payloadGenerator,
} from "../../src/utils/jwtUtil.js";

const originalSecret = process.env.SECRET_KEY;

describe("jwtUtil", () => {
  beforeEach(() => {
    process.env.SECRET_KEY = "test-secret-with-enough-entropy";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SECRET_KEY;
    else process.env.SECRET_KEY = originalSecret;
  });

  test("creates and verifies a bearer token", () => {
    const token = encodeToken("server-1", "admin");
    expect(token).toEqual(expect.any(String));
    expect(decryptToken(token as string)).toEqual(expect.objectContaining({
      sub: "server-1",
      role: "admin",
    }));
    expect(decodeToken(`Bearer ${token}`)).toEqual(expect.objectContaining({
      sub: "server-1",
      role: "admin",
    }));
  });

  test("generates JWT timestamps in seconds", () => {
    const payload = payloadGenerator("server-1", "bot");
    expect(payload.exp - payload.iat).toBe(12);
  });

  test("rejects malformed authorization and invalid tokens", () => {
    expect(getAuthToken("Basic abc")).toBe(false);
    expect(getAuthToken("Bearer ")).toBe(false);
    expect(getAuthToken("Bearer abc")).toBe("abc");
    expect(decodeToken("Bearer invalid")).toBe(false);
  });
});
