import type { IUserConfig } from "../interfaces/IUserConfig.js";
import { pathDirs } from "./envUtil.js";
import fs from "fs";

class configFiles {

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

        const userConfig: IUserConfig = {
            uuid: uuid,
            version: 1,
            user_type: type,
            expired_time: new Date(Date.now() + time * 1000).toISOString(),
            created_at: new Date().toISOString(),
            status: "active",
        };

        fs.writeFileSync(
            this.path(uuid),
            JSON.stringify(userConfig, null, 2),
            "utf-8"
        );

        return true;
    }


    /**
     * Returns user-config by UUID
     * @param uuid - UUID of user
     * @returns IUserConfig | false - user config object or false if not found
     */
    static get(uuid: string): IUserConfig | false {
        return (
            (JSON.parse(fs.readFileSync(this.path(uuid), "utf-8")) as IUserConfig) ??
            false
        );
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
     * @param type - type of user ( admin | user | guest )
     * @returns boolean - true if updated, false if error
     */
    static update(uuid: string, time?: number, type?: string): boolean {
        if (!this.is_exist(uuid)) {
            return false;
        }

        const uuidConfig = this.get(uuid) as IUserConfig;

        if (type && ["admin", "user", "guest"].includes(type)) {
            uuidConfig.user_type = type;
        }

        if (time && time > 0) {
            uuidConfig.expired_time = new Date(
            Date.now() + time * 1000
            ).toISOString();
        }

        fs.writeFileSync(
            this.path(uuid),
            JSON.stringify(uuidConfig, null, 2),
            "utf-8"
        );

        return true;
    }

    /**
     * Delete user-config file
     * @param uuid - UUID of user
     * @returns boolean - true if deleted, false if error
     */
    static delete(uuid: string): boolean {
        if (!this.is_exist(uuid)) {
            return false;
        }

        fs.unlinkSync(this.path(uuid));
        return true;
    }

    static is_exist(uuid: string): boolean {
        return fs.existsSync(this.path(uuid));
    }

    static is_dir_exists(dirPath: string): boolean {
        return fs.existsSync(dirPath);
    }
}

export { configFiles };