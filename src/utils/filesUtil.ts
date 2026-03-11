import { execFile } from "child_process";
import { configPath, pathDirs } from "./envUtil.js";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Check if the configuration file for the given config name exists
 * @param configName - name of the configuration file (without extension)
 * @returns boolean - true if the file exists, false otherwise
 */
export function isFileExist(configName: string): boolean {
    return fs.existsSync(
        path.join(pathDirs().configDir, `/${configName}.ovpn`)
    );
}

/**
 * Get the full path of the configuration file for the given config name
 * @param configName - name of the configuration file (without extension)
 * @returns string - full path of the configuration file
 */
export function getFile(configName: string): string {
  return path.join(pathDirs().configDir, `/${configName}.ovpn`);
}

/**
 * Create a new configuration file for the given UUID if it does not already exist
 * @param uuid - unique identifier for the configuration file (without extension)
 * @returns boolean - true if the file was created, false otherwise
 */
export async function createFile(uuid: string) : Promise<boolean> {
    if (isFileExist(uuid)) {
        return false;
    }

    try {
      await execFileAsync("sudo", [configPath(), "create", uuid]);
      return true;
    }
    catch (error) {
      return false;
    }
}

/**
 * Update the configuration file for the given UUID if it exists
 * @param uuid - unique identifier for the configuration file (without extension)
 * @returns boolean - true if the file was updated, false otherwise
 */
export async function updateFile(uuid: string): Promise<boolean> {
    if (!isFileExist(uuid)) {
      return false;
    }

    try {
      await execFileAsync("sudo", [configPath(), "update", uuid]);
      return true;
    }
    catch(error) {
      return false;
    }
}

/**
 * Delete the configuration file for the given UUID if it exists
 * @param uuid - unique identifier for the configuration file (without extension)
 * @returns boolean - true if the file was deleted, false otherwise
 */
export async function deleteFile(uuid: string): Promise<boolean> {
    if (!isFileExist(uuid)) {
      return false;
    }

    try {
      await execFileAsync("sudo", [configPath(), "revoke", uuid]);
      return true;
    }
    catch (err) {
      return false;
    }
}
 
/** 
 * Check if the configuration directory exists
 * @return boolean - true if the directory exists, false otherwise
 */
export function isDirExists(): boolean {
    return fs.existsSync(
        path.join(pathDirs().configDir)
    );
}