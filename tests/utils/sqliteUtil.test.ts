import { afterEach, beforeEach, describe, expect, test } from "vitest";
import SQLiteClient from "../../src/utils/sqliteUtil.js";

describe("SQLiteClient", () => {
  let db: SQLiteClient;

  beforeEach(async () => {
    db = new SQLiteClient(":memory:");
    await db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, status TEXT)");
  });

  afterEach(() => db.close());

  test("supports CRUD operations", async () => {
    const created = await db.create("users", { name: "Alice", status: "active" }) as any;
    expect(created.lastID).toBe(1);

    await expect(db.get("SELECT * FROM users WHERE id = ?", [1]))
      .resolves.toEqual({ id: 1, name: "Alice", status: "active" });
    await expect(db.read("users", "WHERE status = ?", ["active"]))
      .resolves.toHaveLength(1);

    await db.update("users", { status: "inactive" }, "WHERE id = ?", [1]);
    expect((await db.get("SELECT status FROM users WHERE id = 1") as any).status).toBe("inactive");

    await db.delete("users", "WHERE id = ?", [1]);
    await expect(db.all("SELECT * FROM users")).resolves.toEqual([]);
  });

  test("rejects invalid SQL", async () => {
    await expect(db.run("INVALID SQL")).rejects.toBeTruthy();
  });
});
