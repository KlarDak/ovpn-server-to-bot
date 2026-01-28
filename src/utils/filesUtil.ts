import { pathDirs } from "./envUtil.js";
import fs from "fs";
import path from "path";

export function isFileExist(configName: string): boolean {
    return fs.existsSync(
        path.join(pathDirs().configDir, `/${configName}.ovpn`)
    );
}

export function createFile(configName: string, inDatest?: boolean) : boolean {
    return inDatest ?? true;
}

export function updateFile(configName: string): boolean {
    return true;
}

export function deleteFile(configName: string): boolean {
    return true;
}
 
export function isDirExists(): boolean {
    return fs.existsSync(
        path.join(pathDirs().configDir)
    );
}