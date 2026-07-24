import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/extensions/responseGenerator.js";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  ping: vi.fn(),
  dir: vi.fn(),
  db: vi.fn(),
  exec: vi.fn(),
  currentLoad: vi.fn(),
  mem: vi.fn(),
  fsSize: vi.fn(),
  networkStats: vi.fn(),
  time: vi.fn(),
}));
vi.mock("../../src/utils/redisUtil.js", () => ({
  default: vi.fn(function () {
    return { connect: mocks.connect, ping: mocks.ping };
  }),
}));
vi.mock("../../src/utils/filesUtil.js", () => ({ isDirExists: mocks.dir }));
vi.mock("../../src/utils/configUtil.js", () => ({ configFiles: { isExists: mocks.db } }));
vi.mock("child_process", () => ({ exec: mocks.exec }));
vi.mock("systeminformation", () => ({
  default: {
    currentLoad: mocks.currentLoad,
    mem: mocks.mem,
    fsSize: mocks.fsSize,
    networkStats: mocks.networkStats,
    time: mocks.time,
  },
}));

import serverRouter from "../../src/routers/serverRouter.js";

function appFor(role = "admin") {
  const app = express();
  app.use((req, _res, next) => {
    (req as any).tokenPayload = { role };
    next();
  });
  app.use(serverRouter);
  return app;
}

describe("serverRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connect.mockResolvedValue(true);
    mocks.ping.mockResolvedValue("PONG");
    mocks.dir.mockReturnValue(true);
    mocks.db.mockResolvedValue(true);
    mocks.exec.mockImplementation((_cmd, cb) => cb(null, "123\n"));
    mocks.currentLoad.mockResolvedValue({ currentLoad: 25, avgLoad: 1, cpus: [{}, {}] });
    mocks.mem.mockResolvedValue({ total: 8e9, active: 4e9, free: 2e9, used: 6e9 });
    mocks.fsSize.mockResolvedValue([{ mount: "/", size: 100e9, used: 40e9, available: 60e9 }]);
    mocks.networkStats.mockResolvedValue([{ rx_sec: 2048, tx_sec: 1024 }]);
    mocks.time.mockReturnValue({ uptime: 123 });
  });

  test("enforces admin role", async () => {
    expect((await request(appFor("user")).get("/status/")).status).toBe(403);
  });

  test("reports dependency and OpenVPN status", async () => {
    const response = await request(appFor()).get("/status/");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({
      isRedisRunning: true,
      isConfigsDirExists: true,
      isConfigsDBExists: true,
      isOVPNActive: true,
    }));
  });

  test("returns normalized server metrics", async () => {
    const response = await request(appFor()).get("/metrics");
    expect(response.status).toBe(200);
    expect(response.body.data.cpu.usage_percent).toBe(25);
    expect(response.body.data.network.total_kb_sec).toBe(3);
    expect(response.body.data.uptime_seconds).toBe(123);
  });

  test("reports status and metrics failures", async () => {
    mocks.connect.mockRejectedValue(new Error("redis offline"));
    expect((await request(appFor()).get("/status/")).status).toBe(500);
    mocks.currentLoad.mockRejectedValue(new Error("metrics unavailable"));
    expect((await request(appFor()).get("/metrics")).status).toBe(500);
  });
});
