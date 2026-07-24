import { beforeEach, describe, expect, test, vi } from "vitest";

const client = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: any[]) => void>,
  on: vi.fn((event: string, handler: (...args: any[]) => void) => {
    client.handlers[event] = handler;
  }),
  connect: vi.fn(),
  ping: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  quit: vi.fn(),
}));
vi.mock("redis", () => ({ createClient: vi.fn(() => client) }));

import RedisUtil from "../../src/utils/redisUtil.js";

describe("RedisUtil", () => {
  let redis: RedisUtil;

  beforeEach(() => {
    vi.clearAllMocks();
    client.handlers = {};
    redis = new RedisUtil("localhost", 6379);
  });

  test("wraps normal Redis operations", async () => {
    client.connect.mockResolvedValue(client);
    client.ping.mockResolvedValue("PONG");
    client.get.mockResolvedValue("value");
    client.set.mockResolvedValue("OK");
    client.del.mockResolvedValue(1);
    client.exists.mockResolvedValue(1);
    client.quit.mockResolvedValue("OK");

    expect(await redis.connect()).toBe(client);
    expect(await redis.ping()).toBe("PONG");
    expect(await redis.get("key")).toBe("value");
    expect(await redis.set("key", "value")).toBe(true);
    expect(await redis.set("key", "value", 60)).toBe(true);
    expect(client.set).toHaveBeenLastCalledWith("key", "value", { EX: 60 });
    expect(await redis.del("key")).toBe(1);
    expect(await redis.exists("key")).toBe(true);

    client.handlers.connection?.();
    expect(await redis.connect()).toBe(false);
    expect(await redis.disconnect()).toBe("OK");
  });

  test("returns safe fallbacks when Redis throws", async () => {
    const failure = new Error("offline");
    client.connect.mockRejectedValue(failure);
    client.ping.mockRejectedValue(failure);
    client.get.mockRejectedValue(failure);
    client.set.mockRejectedValue(failure);
    client.del.mockRejectedValue(failure);
    client.exists.mockRejectedValue(failure);

    expect(await redis.connect()).toBe(false);
    expect(await redis.ping()).toBe(false);
    expect(await redis.get("key")).toBe(null);
    expect(await redis.set("key", "value")).toBe(false);
    expect(await redis.del("key")).toBe(0);
    expect(await redis.exists("key")).toBe(false);
    expect(await redis.disconnect()).toBe(false);
  });
});
