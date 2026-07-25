import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

const deps = vi.hoisted(() => ({
  allowedIps: vi.fn(),
  decodeToken: vi.fn(),
}));

vi.mock("../src/utils/envUtil.js", () => ({ allowedIps: deps.allowedIps }));
vi.mock("../src/utils/jwtUtil.js", () => ({ decodeToken: deps.decodeToken }));

vi.mock("../src/routers/usersRouter.js", () => ({ default: express.Router() }));
vi.mock("../src/routers/configDownloadRouter.js", () => ({ default: express.Router() }));
vi.mock("../src/routers/activeRouter.js", () => ({ default: express.Router() }));
vi.mock("../src/routers/serverRouter.js", () => ({ default: express.Router() }));
vi.mock("../src/routers/getConfigRouter.js", () => ({ default: express.Router() }));

import { createApp } from "../src/createApp.js";

describe("application middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.allowedIps.mockReturnValue(["::ffff:127.0.0.1"]);
    deps.decodeToken.mockReturnValue({ role: "admin" });
  });

  test("rejects an IP outside allowlist", async () => {
    deps.allowedIps.mockReturnValue([]);
    expect((await request(createApp()).get("/")).status).toBe(403);
  });

  test("requires authorization outside public config route", async () => {
    expect((await request(createApp()).get("/")).status).toBe(403);
  });

  test("rejects invalid token and empty mutation body", async () => {
    deps.decodeToken.mockReturnValue(false);
    expect((await request(createApp()).get("/").set("Authorization", "Bearer bad")).status).toBe(401);

    expect((await request(createApp()).post("/missing").set("Authorization", "Bearer token")).status).toBe(400);
  });

  test("returns root and not-found responses for authorized requests", async () => {
    const app = createApp();
    expect((await request(app).get("/").set("Authorization", "Bearer token")).status).toBe(200);
    const missing = await request(app).get("/missing").set("Authorization", "Bearer token");
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe("NOT_FOUND");
  });
});
