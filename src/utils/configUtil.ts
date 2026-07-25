import type { IUserConfig } from "../interfaces/IUserConfig.js";
import type { IUpdateConfigUtil } from "../interfaces/IUpdateConfigUtil.js";
import { pathDirs } from "./envUtil.js";
import SQLiteClient from "./sqliteUtil.js";

class configFiles {
  static userDB: SQLiteClient = new SQLiteClient(pathDirs().userDB);

  /**
   * Created user-config file (in .JSON format)
   * @param uuid - UUID of user
   * @param type - type of user ( admin | user | guest )
   * @param time - time in seconds for config expiration (from now)
   * @returns boolean - true if created, false if error
   */
  static async create(uuid: string, type: string, time: number): Promise<boolean> {
    await this.userDB.create("users", {
      uuid: uuid,
      user_type: type,
      created_at: new Date().toISOString(),
      expired_time: new Date(Date.now() + time * 1000).toISOString(),
      status: "active",
    });

    return true;
  }

  /**
   * Returns user-config by UUID
   * @param uuid - UUID of user
   * @returns IUserConfig | false - user config object or false if not found
   */
  static async get(uuid: string): Promise<IUserConfig | false> {
    try {
      const row = await this.userDB.get("SELECT * FROM users WHERE uuid = ?", [
        uuid,
      ]);

      if (!row) {
        return false;
      }

      return row as IUserConfig;
    } catch (error) {
      console.serverError("configUtil", error);
      return false;
    }
  }

  /**
   * Returns path to user-config file
   * @param uuid - UUID of user
   * @returns string - path to user config file
   */
  static path(uuid: string): string {
    return pathDirs().usersDir + `/${uuid}.json`;
  }

  /**
   * Update user-config file
   * @param uuid - UUID of user
   * @param time - time in seconds for config expiration (from now)
   * @param type - type of user ( unblocked | user | unlimit )
   * @returns boolean - true if updated, false if error
   */
  static async update(uuid: string, argsUpdate: IUpdateConfigUtil): Promise<boolean> {
    try {
        if (Object.keys(argsUpdate).length === 0 || (argsUpdate.time !== undefined && argsUpdate.time <= 0) || (argsUpdate.status && !["active", "inactive", "banned"].includes(argsUpdate.status as string))) {
            return false;
        }

      await this.userDB.update(
        "users",
        Object.fromEntries(Object.entries(argsUpdate).filter(([_, value]) => value !== undefined)),
        "WHERE uuid = ?",
        [uuid],
      );

      return true;
    } catch (error) {
      console.serverError("configUtil", error);
      return false;
    }
  }

  /**
   * Delete user-config file
   * @param uuid - UUID of user
   * @returns boolean - true if deleted, false if error
   */
  static async delete(uuid: string): Promise<boolean> {
    try {
      await this.userDB.delete("users", "WHERE uuid = ?", [uuid]);

      return true;
    } catch (error) {
      console.serverError("configUtil", error);
      return false;
    }
  }

  static async isExists(): Promise<boolean> {
    try {
      await this.userDB.get("SELECT 1");

      return true;
    } catch (error) {
      console.serverError("configUtil", error);
      return false;
    }
  }
}

export { configFiles };
