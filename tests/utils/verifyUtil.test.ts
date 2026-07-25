import { describe, expect, test } from "vitest";
import {
  verifyPayloadKeys,
  verifyRequiredFields,
  verifyShortLink,
  verifyUuidFormat,
} from "../../src/utils/verifyUtil.js";

describe("verifyUtil", () => {
  test("validates UUIDs", () => {
    expect(verifyUuidFormat("430a8e06-d9b6-11f0-a8db-38f3ab6d0b2a")).toBe(true);
    expect(verifyUuidFormat("not-a-uuid")).toBe(false);
  });

  test("validates token payload structure and role", () => {
    const valid = { sub: "s", aud: "a", iat: 1, exp: 2, role: "admin" };
    expect(verifyPayloadKeys(valid)).toBe(true);
    expect(verifyPayloadKeys({})).toBe(false);
    expect(verifyPayloadKeys({ ...valid, role: "root" })).toBe(false);
    expect(verifyPayloadKeys(null)).toBe(false);
  });

  test("checks required fields safely", () => {
    expect(verifyRequiredFields({ a: 0, b: false }, ["a", "b"])).toBe(true);
    expect(verifyRequiredFields({ a: 1 }, ["a", "b"])).toBe(false);
    expect(verifyRequiredFields(null, ["a"])).toBe(false);
  });

  test("accepts only six-character alphanumeric short links", () => {
    expect(verifyShortLink("aB12Z9")).toBe(true);
    expect(verifyShortLink("aB-2Z9")).toBe(false);
    expect(verifyShortLink("short")).toBe(false);
  });
});
