import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

import "../../src/extensions/responseGenerator.js";

const mocks = vi.hoisted(() => ({
  updateAll: vi.fn(),
  deleteAll: vi.fn(),
  kickUser: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock("../../src/utils/configUtil.js", () => ({
  configFiles: {
    updateAll: mocks.updateAll,
    deleteAll: mocks.deleteAll,
  },
}));

vi.mock("../../src/services/doActionUser.js", () => ({
  kickUser: mocks.kickUser,
}));

vi.mock("../../src/utils/filesUtil.js", () => ({
  deleteFile: mocks.deleteFile,
}));

import configsRouter from "../../src/routers/configsRouter.js";

const uuid = "41649438-8844-11f1-9c27-4f9a5cf82333";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tokenPayload = { role: "admin" };
    next();
  });
  app.use("/configs", configsRouter);
  return app;
}

describe("configsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateAll.mockResolvedValue(true);
    mocks.deleteAll.mockResolvedValue(true);
    mocks.kickUser.mockResolvedValue(undefined);
    mocks.deleteFile.mockResolvedValue(true);
  });

  test("returns a JSON body after a successful bulk POST", async () => {
    const response = await request(createTestApp())
      .post("/configs/ban")
      .send({ uuids: [uuid] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 200,
      message: "UUIDS_CONFIGURATION_BANNED",
      data: null,
    });
    expect(mocks.kickUser).toHaveBeenCalledWith(uuid);
  });

  test("returns JSON after delete and passes UUID values to deleteFile", async () => {
    const response = await request(createTestApp())
      .delete("/configs/drop")
      .send({ uuids: [uuid] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 200,
      message: "UUIDS_CONFIGURATION_DELETED",
      data: null,
    });
    expect(mocks.deleteFile).toHaveBeenCalledWith(uuid);
  });
});
