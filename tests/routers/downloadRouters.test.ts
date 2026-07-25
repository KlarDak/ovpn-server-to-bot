import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/extensions/responseGenerator.js";

const mocks = vi.hoisted(() => ({
  decode: vi.fn(),
  exists: vi.fn(),
  file: vi.fn(),
}));
vi.mock("../../src/utils/slinkUtil.js", () => ({ decodeLink: mocks.decode }));
vi.mock("../../src/utils/filesUtil.js", () => ({
  isFileExist: mocks.exists,
  getFile: mocks.file,
}));

import getConfigRouter from "../../src/routers/getConfigRouter.js";
import configDownloadRouter from "../../src/routers/configDownloadRouter.js";

function appFor(router: express.Router, role = "site") {
  const app = express();
  app.use((req, _res, next) => {
    (req as any).tokenPayload = { role };
    next();
  });
  app.use(router);
  return app;
}

describe("configuration download routers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.decode.mockResolvedValue("uuid");
    mocks.exists.mockReturnValue(false);
    mocks.file.mockReturnValue("missing.ovpn");
  });

  test.each([
    [getConfigRouter, "public"],
    [configDownloadRouter, "site"],
  ])("validates link lifecycle", async (router, role) => {
    expect((await request(appFor(router, role)).get("/bad")).status).toBe(400);
    mocks.decode.mockResolvedValue(false);
    expect((await request(appFor(router, role)).get("/ABC123")).status).toBe(404);
    mocks.decode.mockResolvedValue("uuid");
    expect((await request(appFor(router, role)).get("/ABC123")).body.message).toBe("CONFIG_FILE_NOT_FOUND");
  });

  test("protected download requires site role", async () => {
    expect((await request(appFor(configDownloadRouter, "user")).get("/ABC123")).status).toBe(403);
  });
});
