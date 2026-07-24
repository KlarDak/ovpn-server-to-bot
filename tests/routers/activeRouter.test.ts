import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/extensions/responseGenerator.js";

const mocks = vi.hoisted(() => ({
  clients: vi.fn(),
  kick: vi.fn(),
  update: vi.fn(),
}));
vi.mock("../../src/services/doActionUser.js", () => ({
  getConnectedClients: mocks.clients,
  kickUser: mocks.kick,
}));
vi.mock("../../src/utils/configUtil.js", () => ({
  configFiles: { update: mocks.update },
}));

import activeRouter from "../../src/routers/activeRouter.js";

function appFor(role = "admin") {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tokenPayload = { role };
    next();
  });
  app.use(activeRouter);
  return app;
}

const uuid = "430a8e06-d9b6-11f0-a8db-38f3ab6d0b2a";

describe("activeRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clients.mockResolvedValue([{ uuid }]);
    mocks.kick.mockResolvedValue(undefined);
    mocks.update.mockResolvedValue(true);
  });

  test("enforces admin role and UUID validation", async () => {
    expect((await request(appFor("user")).get("/")).status).toBe(403);
    expect((await request(appFor()).post("/kick").send({ uuid: "bad" })).status).toBe(400);
  });

  test("lists, kicks, bans and pardons users", async () => {
    expect((await request(appFor()).get("/list")).body.data.count).toBe(1);
    expect((await request(appFor()).post("/kick").send({ uuid })).status).toBe(200);
    expect((await request(appFor()).post("/ban").send({ uuid })).status).toBe(200);
    expect((await request(appFor()).post("/pardon").send({ uuid })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(uuid, { status: "inactive" });
    expect(mocks.update).toHaveBeenCalledWith(uuid, { status: "banned" });
    expect(mocks.update).toHaveBeenCalledWith(uuid, { status: "active" });
  });

  test("reports dependency failures", async () => {
    mocks.clients.mockRejectedValue(new Error("db offline"));
    expect((await request(appFor()).get("/list")).status).toBe(500);
    mocks.kick.mockRejectedValue(new Error("vpn offline"));
    expect((await request(appFor()).post("/kick").send({ uuid })).status).toBe(500);
  });
});
