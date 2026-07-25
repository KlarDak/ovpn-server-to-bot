import { beforeEach, describe, expect, test, vi } from "vitest";

const redis = vi.hoisted(() => ({
  connect: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("../../src/utils/redisUtil.js", () => ({
  default: vi.fn(function () { return redis; }),
}));

import { decodeLink, encodeLink, generateSymbol } from "../../src/utils/slinkUtil.js";

describe("slinkUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redis.connect.mockResolvedValue(true);
    redis.disconnect.mockResolvedValue("OK");
  });

  test("generates an alphanumeric symbol of requested length", () => {
    expect(generateSymbol(12)).toMatch(/^[A-Za-z0-9]{12}$/);
  });

  test("stores a short link with TTL", async () => {
    redis.set.mockResolvedValue(true);
    const link = await encodeLink("uuid", 60);
    expect(link).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(redis.set).toHaveBeenCalledWith(`sl:${link}`, "uuid", 60);
  });

  test("resolves and consumes a one-time link", async () => {
    redis.get.mockResolvedValue("uuid");
    await expect(decodeLink("ABC123")).resolves.toBe("uuid");
    expect(redis.del).toHaveBeenCalledWith("sl:ABC123");
    expect(redis.disconnect).toHaveBeenCalled();
  });

  test("returns false on Redis failures", async () => {
    redis.connect.mockRejectedValue(new Error("offline"));
    await expect(encodeLink("uuid", 60)).resolves.toBe(false);
    await expect(decodeLink("ABC123")).resolves.toBe(false);
  });
});
