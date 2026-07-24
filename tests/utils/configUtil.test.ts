import { beforeEach, describe, expect, test, vi } from "vitest";
import { configFiles } from "../../src/utils/configUtil.js";

describe("configFiles", () => {
  const db = {
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    configFiles.userDB = db as any;
  });

  test("creates a user with calculated expiration", async () => {
    db.create.mockResolvedValue({ changes: 1 });
    expect(await configFiles.create("uuid", "user", 60)).toBe(true);
    expect(db.create).toHaveBeenCalledWith("users", expect.objectContaining({
      uuid: "uuid",
      user_type: "user",
      status: "active",
    }));
  });

  test("returns a user or false when it does not exist", async () => {
    db.get.mockResolvedValueOnce({ uuid: "uuid" }).mockResolvedValueOnce(undefined);
    await expect(configFiles.get("uuid")).resolves.toEqual({ uuid: "uuid" });
    await expect(configFiles.get("missing")).resolves.toBe(false);
  });

  test("validates updates and filters undefined values", async () => {
    expect(await configFiles.update("uuid", {})).toBe(false);
    expect(await configFiles.update("uuid", { time: 0 })).toBe(false);
    expect(await configFiles.update("uuid", { status: "broken" })).toBe(false);

    db.update.mockResolvedValue({ changes: 1 });
    expect(await configFiles.update("uuid", { user_type: "admin", time: undefined })).toBe(true);
    expect(db.update).toHaveBeenCalledWith(
      "users",
      { user_type: "admin" },
      "WHERE uuid = ?",
      ["uuid"],
    );
  });

  test("deletes records and reports database availability", async () => {
    db.delete.mockResolvedValue({ changes: 1 });
    db.get.mockResolvedValue(1);
    await expect(configFiles.delete("uuid")).resolves.toBe(true);
    await expect(configFiles.isExists()).resolves.toBe(true);

    db.get.mockRejectedValue(new Error("offline"));
    await expect(configFiles.isExists()).resolves.toBe(false);
  });
});
