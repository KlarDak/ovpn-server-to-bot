import type { IResponseConfig } from "../interfaces/IResponseConfig.js";
import type { IUserConfig } from "../interfaces/IUserConfig.js";
import { configFiles } from "../utils/configUtil.js";
import { createFile, deleteFile, isFileExist, updateFile } from "../utils/filesUtil.js";
import { responseGenerator } from "../utils/resgenUtil.js";
import { encodeLink } from "../utils/slinkUtil.js";
import { verifyRequiredFields, verifyUuidFormat } from "../utils/verifyUtil.js";

/**
 * Retrieve the user configuration for the given UUID if it exists, and return a standardized response object containing the status code, message and user configuration data. The function first verifies if the input UUID is in a valid format using the verifyUuidFormat function. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the UUID format is valid but the corresponding configuration file does not exist, it returns a response with a 404 status code and an appropriate error message. If the configuration file exists, it retrieves the user parameters from the configFiles object and returns a response with a 200 status code, a success message, and the retrieved user configuration data.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @returns IResponseConfig - standardized response object containing the status code, message and user configuration data if retrieval is successful, or an appropriate error message if retrieval fails due to invalid UUID format or non-existent configuration file
 */
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

/**
 * Create a new configuration file for the given UUID if it does not already exist, and return a standardized response object containing the status code, message and relevant data. The function first checks if the required fields (uuid, type and time) are provided in the input parameters. If any of the required fields are missing, it returns a response with a 400 status code and an appropriate error message. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the configuration file already exists for the given UUID, it returns a response with a 409 status code and an appropriate error message. If the configuration file is successfully created, it creates a new user configuration using the configFiles object and returns a response with a 200 status code, a success message, and relevant data including the UUID and generated short link.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @param type - type of the user configuration, which can be used to categorize or differentiate between different configurations
 * @param time - time-to-live (TTL) in seconds for the user configuration, which determines how long the configuration will be valid before it expires
 * @returns IResponseConfig - standardized response object containing the status code, message and relevant data if creation is successful, or an appropriate error message if creation fails due to missing required fields, invalid UUID format, or existing configuration file for the given UUID
 */
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

/** 
 * Update the user configuration for the given UUID if it exists, and return a standardized response object containing the status code, message and relevant data. The function first checks if at least one of the fields (type or time) is provided for update. If neither field is provided, it returns a response with a 400 status code and an appropriate error message. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the configuration file does not exist for the given UUID, it returns a response with a 409 status code and an appropriate error message. If the user configuration is successfully updated, it returns a response with a 200 status code, a success message, and relevant data including the UUID.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @param type - optional new type for the user configuration, which can be used to update the existing configuration type
 * @param time - optional new time-to-live (TTL) in seconds for the user configuration, which can be used to update the existing configuration TTL
 * @return IResponseConfig - standardized response object containing the status code, message and relevant data if update is successful, or an appropriate error message if update fails due to missing fields for update, invalid UUID format, or non-existent configuration file for the given UUID
*/
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

/**
 * Update the user configuration for the given UUID if it exists, and return a standardized response object containing the status code, message and relevant data. The function first checks if at least one of the fields (type or time) is provided for update. If neither field is provided, it returns a response with a 400 status code and an appropriate error message. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the configuration file does not exist for the given UUID, it returns a response with a 409 status code and an appropriate error message. If the user configuration is successfully updated, it returns a response with a 200 status code, a success message, and relevant data including the UUID.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @param time - optional new time-to-live (TTL) in seconds for the user configuration, which can be used to update the existing configuration TTL
 * @param type - optional new type for the user configuration, which can be used to update the existing configuration type
 * @returns IResponseConfig - standardized response object containing the status code, message and relevant data if update is successful, or an appropriate error message if update fails due to missing fields for update, invalid UUID format, or non-existent configuration file for the given UUID
 */
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

/**
 * Delete the user configuration for the given UUID if it exists, and return a standardized response object containing the status code, message and relevant data. The function first verifies if the input UUID is in a valid format using the verifyUuidFormat function. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the configuration file does not exist for the given UUID, it returns a response with a 404 status code and an appropriate error message. If the configuration file is successfully deleted and the user configuration is removed from the configFiles object, it returns a response with a 200 status code, a success message, and relevant data including the UUID.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @returns IResponseConfig - standardized response object containing the status code, message and relevant data if deletion is successful, or an appropriate error message if deletion fails due to invalid UUID format or non-existent configuration file for the given UUID
 */
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