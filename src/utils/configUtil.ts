import type { IUserConfig } from "../interfaces/IUserConfig.js";
import { pathDirs } from "./envUtil.js";
import SQLiteClient from "./sqliteUtil.js";

class configFiles {


    static getConnect(): SQLiteClient {
        return new SQLiteClient(pathDirs().userDB);
    }
    /**
     * Created user-config file (in .JSON format)
     * @param uuid - UUID of user
     * @param type - type of user ( admin | user | guest )
     * @param time - time in seconds for config expiration (from now)
     * @returns boolean - true if created, false if error
     */
    static create(uuid: string, type: string, time: number): boolean {
        if (!["admin", "user", "guest"].includes(type) && time <= 0) {
            return false;
        }

        this.getConnect().create("users", {
            uuid: uuid,
            user_type: type,
            created_at: new Date().toISOString(),
            expired_time: new Date(Date.now() + time * 1000).toISOString(),
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
            const row = await this.getConnect().get(
              "SELECT * FROM users WHERE uuid = ?",
              [uuid],
            );
            if (!row) {
                return false;
            } 
            
            return row as IUserConfig;
        } catch (error) {
            console.error("Error fetching user config:", error);
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


    static async createTable(): Promise<boolean> {
        try {
            await this.getConnect().run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT UNIQUE NOT NULL,
                    user_type TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expired_time TEXT NOT NULL
                )
            `);
            console.log("Users table created or already exists.");

            return true;
        }
        catch (error) {
            console.error("Error creating users table:", error);
            return false;
        }
    }
    /**
     * Update user-config file
     * @param uuid - UUID of user
     * @param time - time in seconds for config expiration (from now)
     * @param type - type of user ( admin | user | guest )
     * @returns boolean - true if updated, false if error
     */
    static async update(uuid: string, time?: number, type?: string): Promise<boolean> {
        try {
          const updates: any = {};

          if (time && time > 0) {
            updates.expired_time = new Date(
              Date.now() + time * 1000,
            ).toISOString();
          }

          if (type && ["admin", "user", "guest"].includes(type)) {
            updates.user_type = type;
          }

          if (Object.keys(updates).length === 0) {
            return false; // No valid updates provided
          }

          await this.getConnect().update("users", updates, "WHERE uuid = ?", [uuid])
            
          return true;
        } catch (error) {
            console.error("An error has been occurred during user config update:", error);
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
            await this.getConnect().delete("users", "WHERE uuid = ?", [uuid])
            ;
            return true;
        } catch (error) {
            console.error("An error has been occurred during user config deletion:", error);
            return false;
        }
    }

    static async isExists(): Promise<boolean> {
        try {
            await this.getConnect().get("SELECT 1");
            return true;
        }
        catch (error) {            
            console.error("User DB does not exist or is not accessible:", error);
            return false;
        }
    }
}

export { configFiles };