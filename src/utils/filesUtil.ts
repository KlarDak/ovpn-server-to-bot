import { execFile } from "child_process";
import { configPath, pathDirs } from "./envUtil.js";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function isFileExist(configName: string): boolean {
    return fs.existsSync(
        path.join(pathDirs().configDir, `/${configName}.ovpn`)
    );
}

export async function createFile(uuid: string, inDatest?: boolean) : Promise<boolean> {
    if (isFileExist(uuid)) {
        return false;
    }

    const newUser = await execFileAsync(configPath(), ["create", uuid, pathDirs().configDir]);

    if (newUser.stderr) {
        console.error("An error has been occurred during file creation:", newUser.stderr);
        return false;
    }
    else {
        return true;
    }
}

export async function updateFile(uuid: string): Promise<boolean> {
    if (!isFileExist(uuid)) {
      return false;
    }

    const newUser = await execFileAsync(configPath(), ["update", uuid, pathDirs().configDir]);

    if (newUser.stderr) {
      console.error(
        "An error has been occurred during file updating:",
        newUser.stderr,
      );
      return false;
    } else {
      return true;
    }
}

export async function deleteFile(uuid: string): Promise<boolean> {
    if (!isFileExist(uuid)) {
      return false;
    }

    const newUser = await execFileAsync(configPath(), ["delete", uuid, pathDirs().configDir]);
    if (newUser.stderr) {
      console.error(
        "An error has been occurred during file deletion:",
        newUser.stderr,
      );
      return false;
    } else {
      return true;
    }
}
 
export function isDirExists(): boolean {
    return fs.existsSync(
        path.join(pathDirs().configDir)
    );
}