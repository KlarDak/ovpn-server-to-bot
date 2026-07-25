import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/extensions/responseGenerator.js";

const services = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../../src/services/configsServices.js", () => ({
  getUserConfig: services.get,
  postUserConfig: services.post,
  putUserConfig: services.put,
  patchUserConfig: services.patch,
  deleteUserConfig: services.remove,
}));

import usersRouter from "../../src/routers/usersRouter.js";

function appFor(role: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tokenPayload = { role };
    next();
  });
  app.use(usersRouter);
  return app;
}

describe("usersRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of Object.values(services)) {
      mock.mockResolvedValue({ code: 200, message: "OK", data: null });
    }
  });

  test("rejects insufficient role", async () => {
    const response = await request(appFor("user")).get("/uuid");
    expect(response.status).toBe(403);
  });

  test("delegates all CRUD routes", async () => {
    expect((await request(appFor("admin")).get("/uuid")).status).toBe(200);
    expect((await request(appFor("bot")).post("/").send({ uuid: "uuid", type: "user", time: 60 })).status).toBe(200);
    expect((await request(appFor("admin")).put("/uuid").send({ type: "admin", time: 120 })).status).toBe(200);
    expect((await request(appFor("admin")).patch("/uuid").send({ type: "user", time: 30 })).status).toBe(200);
    expect((await request(appFor("admin")).delete("/uuid")).status).toBe(200);

    expect(services.patch).toHaveBeenCalledWith("uuid", 30, "user");
  });
});
