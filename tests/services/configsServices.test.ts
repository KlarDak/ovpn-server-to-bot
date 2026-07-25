import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isFileExist: vi.fn(),
  createFile: vi.fn(),
  updateFile: vi.fn(),
  deleteFile: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  encodeLink: vi.fn(),
}));

vi.mock("../../src/utils/filesUtil.js", () => ({
  isFileExist: mocks.isFileExist,
  createFile: mocks.createFile,
  updateFile: mocks.updateFile,
  deleteFile: mocks.deleteFile,
}));
vi.mock("../../src/utils/configUtil.js", () => ({
  configFiles: {
    get: mocks.get,
    create: mocks.create,
    update: mocks.update,
    delete: mocks.delete,
  },
}));
vi.mock("../../src/utils/slinkUtil.js", () => ({ encodeLink: mocks.encodeLink }));

import {
  deleteUserConfig,
  getUserConfig,
  patchUserConfig,
  postUserConfig,
  putUserConfig,
} from "../../src/services/configsServices.js";

describe("configsServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFileExist.mockReturnValue(true);
    mocks.createFile.mockResolvedValue(true);
    mocks.updateFile.mockResolvedValue(true);
    mocks.deleteFile.mockResolvedValue(true);
    mocks.get.mockResolvedValue({ uuid: "uuid" });
    mocks.create.mockResolvedValue(true);
    mocks.update.mockResolvedValue(true);
    mocks.delete.mockResolvedValue(true);
    mocks.encodeLink.mockResolvedValue("ABC123");
  });

  test("gets existing configuration and rejects a missing file", async () => {
    await expect(getUserConfig("uuid")).resolves.toEqual(expect.objectContaining({
      code: 200,
      message: "USER_CONFIG_RETRIEVED",
    }));
    mocks.isFileExist.mockReturnValue(false);
    await expect(getUserConfig("uuid")).resolves.toEqual(expect.objectContaining({ code: 404 }));
  });

  test("creates configuration only after the shell operation succeeds", async () => {
    mocks.isFileExist.mockReturnValue(false);
    await expect(postUserConfig("uuid", "user", 60)).resolves.toEqual(expect.objectContaining({
      code: 200,
      data: { uuid: "uuid", link: "ABC123" },
    }));
    expect(mocks.createFile).toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalled();

    mocks.createFile.mockResolvedValue(false);
    await expect(postUserConfig("uuid", "user", 60)).resolves.toEqual(expect.objectContaining({
      code: 500,
      message: "CONFIG_FILE_CREATION_FAILED",
    }));
    expect(mocks.create).not.toHaveBeenCalledTimes(2);
  });

  test("validates create and update fields", async () => {
    await expect(postUserConfig("uuid", "", 60)).resolves.toEqual(expect.objectContaining({ code: 400 }));
    await expect(putUserConfig("uuid", "", 60)).resolves.toEqual(expect.objectContaining({ code: 400 }));
    await expect(patchUserConfig("uuid")).resolves.toEqual(expect.objectContaining({ code: 400 }));
  });

  test("updates file and database", async () => {
    await expect(putUserConfig("uuid", "admin", 120)).resolves.toEqual(expect.objectContaining({ code: 200 }));
    expect(mocks.updateFile).toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith("uuid", { user_type: "admin", time: 120 });

    await expect(patchUserConfig("uuid", 30, "user")).resolves.toEqual(expect.objectContaining({ code: 200 }));
    expect(mocks.update).toHaveBeenLastCalledWith("uuid", { user_type: "user", time: 30 });
  });

  test("deletes file before database record", async () => {
    await expect(deleteUserConfig("uuid")).resolves.toEqual(expect.objectContaining({ code: 200 }));
    mocks.deleteFile.mockResolvedValue(false);
    await expect(deleteUserConfig("uuid")).resolves.toEqual(expect.objectContaining({
      code: 500,
      message: "USER_CONFIGURATION_DELETE_FAILED",
    }));
  });
});
