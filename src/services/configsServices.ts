import type { IResponseConfig } from "../interfaces/IResponseConfig.js";
import type { IUserConfig } from "../interfaces/IUserConfig.js";
import { configFiles } from "../utils/configUtil.js";
import { createFile, deleteFile, isFileExist, updateFile } from "../utils/filesUtil.js";
import { responseGenerator } from "../utils/resgenUtil.js";
import { encodeLink } from "../utils/slinkUtil.js";
import { verifyRequiredFields, verifyUuidFormat } from "../utils/verifyUtil.js";

export function getUserConfig(uuid: string): IResponseConfig {
    if (!verifyUuidFormat(uuid)) {
      return responseGenerator(400, "Invalid UUID format");
    }

    if (!isFileExist(uuid)) {
      return responseGenerator(404, "Configuration file not found");
    }
    
    const userParams = configFiles.get(uuid) ?? ({} as IUserConfig);

    return responseGenerator(200, "User configuration retrieved successfully", userParams);
}

export async function postUserConfig(uuid: string, type: string, time: number): Promise<IResponseConfig> {
    if (!uuid && !type && !time) {
        return responseGenerator(400, "Missing required fields: uuid, type, time");
    }

    if (!verifyUuidFormat(uuid)) {
        return responseGenerator(400, "Invalid UUID format");
    }

    if (isFileExist(uuid)) {
        return responseGenerator(409, "Configuration file already exists");
    }

    const uuidFileCreated = createFile(uuid);

    if (!uuidFileCreated) {
        return responseGenerator(500, "Failed to create configuration file");
    }

    const userConfigCreated = configFiles.create(uuid, type, time);

    if (!userConfigCreated) {
        return responseGenerator(500, "Failed to create user configuration");
    }

    return responseGenerator(200, "User configuration created successfully", 
        {
            "uuid": uuid,
            "link": await encodeLink(uuid, time)
        }
    );
}

export async function putUserConfig(uuid: string, type: string, time: number): Promise<IResponseConfig> {
    if (!verifyUuidFormat(uuid)) {
        return responseGenerator(400, "Invalid UUID format")
    }

    if (!isFileExist(uuid)) {
        return responseGenerator(409, "Configuration file is not exists")
    }
    
    const uuidFileCreated = updateFile(uuid);

    if (!uuidFileCreated) {
        return responseGenerator(500, "Failed to update configuration file")
    }

    const updatedUserConfig = configFiles.update(uuid, time, type);

    if (!updatedUserConfig) {
        return responseGenerator(500, "Failed to update user configuration")
    }

    return responseGenerator(200, "User configuration updated successfully", {
        "uuid": uuid,
        "link": await encodeLink(uuid, time)
    });
}

export async function patchUserConfig(uuid: string, time?: number, type?: string): Promise<IResponseConfig> {
    if (!type && !time) {
        return responseGenerator(400, "At least one field (type or time) must be provided for update");
    }
    
    if (!verifyUuidFormat(uuid)) {
      return responseGenerator(400, "Invalid UUID format");
    }

    if (!isFileExist(uuid)) {
      return responseGenerator(409, "Configuration file is not exists");
    }

    const updatedUserConfig = configFiles.update(uuid, time, type);

    if (!updatedUserConfig) {
      return responseGenerator(500, "Failed to update user configuration");
    }

    return responseGenerator(200, "User configuration updated successfully", {
      uuid: uuid
    });
}

export function deleteUserConfig(uuid: string): IResponseConfig {
    if (!verifyUuidFormat(uuid)) {
        return responseGenerator(400, "Invalid UUID format")
    }

    const uuidFile = deleteFile(uuid);

    if (!uuidFile) {
        return responseGenerator(500, "Failed to delete configuration file")
    }

    const deleteUserConfig = configFiles.delete(uuid);

    if (!deleteUserConfig) {
        return responseGenerator(500, "Failed to delete user configuration")
    }

    return responseGenerator(200, "User configuration deleted successfully", {
        uuid: uuid
    });
}