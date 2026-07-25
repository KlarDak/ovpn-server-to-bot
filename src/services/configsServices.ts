import type { IResponseConfig } from "../interfaces/IResponseArray.js";
import type { IUserConfig } from "../interfaces/IUserConfig.js";
import { configFiles } from "../utils/configUtil.js";
import { createFile, deleteFile, isFileExist, updateFile } from "../utils/filesUtil.js";
import { responseGenerator } from "../utils/resgenUtil.js";
import { encodeLink } from "../utils/slinkUtil.js";

/**
 * Retrieve the user configuration for the given UUID if it exists, and return a standardized response object containing the status code, message and user configuration data. The function first verifies if the input UUID is in a valid format using the verifyUuidFormat function. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the UUID format is valid but the corresponding configuration file does not exist, it returns a response with a 404 status code and an appropriate error message. If the configuration file exists, it retrieves the user parameters from the configFiles object and returns a response with a 200 status code, a success message, and the retrieved user configuration data.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @returns IResponseConfig - standardized response object containing the status code, message and user configuration data if retrieval is successful, or an appropriate error message if retrieval fails due to invalid UUID format or non-existent configuration file
 */
export async function getUserConfig(uuid: string): Promise<IResponseConfig> {
    if (!isFileExist(uuid)) {
      return responseGenerator(404, "CONFIG_FILE_NOT_FOUND");
    }
    
    const userParams = await configFiles.get(uuid) ?? ({} as IUserConfig);

    return responseGenerator(200, "USER_CONFIG_RETRIEVED", userParams);
}

/**
 * Create a new configuration file for the given UUID if it does not already exist, and return a standardized response object containing the status code, message and relevant data. The function first checks if the required fields (uuid, type and time) are provided in the input parameters. If any of the required fields are missing, it returns a response with a 400 status code and an appropriate error message. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the configuration file already exists for the given UUID, it returns a response with a 409 status code and an appropriate error message. If the configuration file is successfully created, it creates a new user configuration using the configFiles object and returns a response with a 200 status code, a success message, and relevant data including the UUID and generated short link.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @param type - type of the user configuration, which can be used to categorize or differentiate between different configurations
 * @param time - time-to-live (TTL) in seconds for the user configuration, which determines how long the configuration will be valid before it expires
 * @returns IResponseConfig - standardized response object containing the status code, message and relevant data if creation is successful, or an appropriate error message if creation fails due to missing required fields, invalid UUID format, or existing configuration file for the given UUID
 */
export async function postUserConfig(uuid: string, type: string, time: number): Promise<IResponseConfig> {
    if (!type || !time) {
        return responseGenerator(400, "MISSING_REQUIRED_FIELDS");
    }

    if (isFileExist(uuid)) {
        return responseGenerator(409, "CONFIG_FILE_ALREADY_EXISTS");
    }

    const uuidFileCreated = await createFile(uuid);

    if (!uuidFileCreated) {
        return responseGenerator(500, "CONFIG_FILE_CREATION_FAILED");
    }

    const userConfigCreated = await configFiles.create(uuid, type, time);

    if (!userConfigCreated) {
        return responseGenerator(500, "DATABASE_RECORD_CREATION_FAILED");
    }

    return responseGenerator(200, "USER_CONFIGURATION_CREATED", 
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
    if (!isFileExist(uuid)) {
        return responseGenerator(409, "CONFIG_FILE_NOT_FOUND");
    }

    if (!type || !time) {
      return responseGenerator(400, "UPDATE_FIELDS_MISSING");
    }
    
    const uuidFileCreated = await updateFile(uuid);

    if (!uuidFileCreated) {
        return responseGenerator(500, "CONFIG_FILE_UPDATE_FAILED")
    }

    const updatedUserConfig = await configFiles.update(uuid, {
        user_type: type,
        time
    });

    if (!updatedUserConfig) {
        return responseGenerator(500, "DATABASE_RECORD_UPDATE_FAILED")
    }

    return responseGenerator(200, "USER_CONFIGURATION_UPDATED", {
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
        return responseGenerator(400, "UPDATE_FIELDS_MISSING");
    }

    if (!isFileExist(uuid)) {
      return responseGenerator(409, "CONFIG_FILE_NOT_FOUND");
    }

    const updatedUserConfig = await configFiles.update(uuid, {
      ...(type !== undefined ? { user_type: type } : {}),
      ...(time !== undefined ? { time } : {})
    });

    if (!updatedUserConfig) {
      return responseGenerator(500, "DATABASE_RECORD_UPDATE_FAILED");
    }

    return responseGenerator(200, "USER_CONFIGURATION_UPDATED", {
      uuid: uuid
    });
}

/**
 * Delete the user configuration for the given UUID if it exists, and return a standardized response object containing the status code, message and relevant data. The function first verifies if the input UUID is in a valid format using the verifyUuidFormat function. If the UUID format is invalid, it returns a response with a 400 status code and an appropriate error message. If the configuration file does not exist for the given UUID, it returns a response with a 404 status code and an appropriate error message. If the configuration file is successfully deleted and the user configuration is removed from the configFiles object, it returns a response with a 200 status code, a success message, and relevant data including the UUID.
 * @param uuid - unique identifier for the user configuration, which should be in a valid UUID format
 * @returns IResponseConfig - standardized response object containing the status code, message and relevant data if deletion is successful, or an appropriate error message if deletion fails due to invalid UUID format or non-existent configuration file for the given UUID
 */
export async function deleteUserConfig(uuid: string): Promise<IResponseConfig> {
    const uuidFile = await deleteFile(uuid);

    if (!uuidFile) {
        return responseGenerator(500, "USER_CONFIGURATION_DELETE_FAILED")
    }

    const deleteUserConfig = await configFiles.delete(uuid);

    if (!deleteUserConfig) {
        return responseGenerator(500, "DATABASE_RECORD_DELETE_FAILED")
    }

    return responseGenerator(200, "USER_CONFIGURATION_DELETED", {
        uuid: uuid
    });
}
