import Router from 'express';
import type { Request, Response, NextFunction } from 'express';
import { responseGenerator } from '../utils/resgenUtil.js';
import { verifyRequiredFields, verifyUuidFormat } from '../utils/verifyUtil.js';
import { createFile, updateFile, deleteFile, isFileExist } from '../utils/filesUtil.js';
import { encodeLink } from '../utils/slinkUtil.js';
import { configFiles} from '../utils/configUtil.js';
import type { IUserConfig } from '../interfaces/IUserConfig.js';

const usersRouter = Router();

usersRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.role !== "user") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }
    
    next();
});

usersRouter.get("/config/:uuid", (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;
    if (!verifyUuidFormat(uuid)) {
        return res.status(400).json(responseGenerator(400, "Invalid UUID format"));
    }

    if (!isFileExist(uuid)) {
        return res.status(404).json(responseGenerator(404, "Configuration file not found"));
    }

    const userParams = configFiles.get(uuid) ?? ({} as IUserConfig);

    return res
      .status(200)
      .json(
        responseGenerator(
          200,
          "User configuration retrieved successfully",
          userParams
        )
      );
});

// Запрос на создание конфигурационного файла пользователя
// В body: uuid - имя пользователя, type - тип пользователя,  time - время работы конфиг-файла
usersRouter.post("/config", async (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;

    if (!verifyRequiredFields(req.body, ["uuid", "type", "time"])) {
        return res.status(400).json(responseGenerator(400, "Missing required fields: uuid, type, time"));
    }

    if (!verifyUuidFormat(uuid)) {
        return res.status(400).json(responseGenerator(400, "Invalid UUID format"));
    }

    if (isFileExist(uuid)) {
        return res.status(409).json(responseGenerator(409, "Configuration file already exists"));
    }

    const uuidFileCreated = createFile(uuid);

    if (!uuidFileCreated) {
        return res.status(500).json(responseGenerator(500, "Failed to create configuration file"));
    }

    const userConfigCreated = configFiles.create(uuid, type, time);

    if (!userConfigCreated) {
        return res.status(500).json(responseGenerator(500, "Failed to create user configuration"));
    }

    return res.status(200).json(responseGenerator(200, "User configuration created successfully", {
        "uuid": uuid,
        "link": await encodeLink(uuid, time)
    }));
});

usersRouter.put("/config", (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;

    if (!verifyRequiredFields(req.body, ["uuid", "type", "time"])) {
      return res
        .status(400)
        .json(
          responseGenerator(400, "Missing required fields: uuid, type, time")
        );
    }

    if (!verifyUuidFormat(uuid)) {
      return res
        .status(400)
        .json(responseGenerator(400, "Invalid UUID format"));
    }

    if (isFileExist(uuid)) {
      return res
        .status(409)
        .json(responseGenerator(409, "Configuration file already exists"));
    }
    
    const uuidFileCreated = updateFile(uuid);

    if (!uuidFileCreated) {
        return res.status(500).json(responseGenerator(500, "Failed to update configuration file"));
    }

    const updatedUserConfig = configFiles.update(uuid, type, time);

    if (!updatedUserConfig) {
        return res.status(500).json(responseGenerator(500, "Failed to update user configuration"));
    }

    return res.status(200).json(responseGenerator(200, "User configuration updated successfully", {
        "uuid": uuid,
        "link": encodeLink(uuid, time)
    }));
});

usersRouter.patch("/config", (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;

    if (!verifyRequiredFields(req.body, ["uuid"])) {
      return res
        .status(400)
        .json(responseGenerator(400, "Missing required field: uuid"));
    }

    if (!type && !time) {
        return res.status(400).json(responseGenerator(400, "At least one of the fields 'type' or 'time' must be provided for update"));
    }

    if (!verifyUuidFormat(uuid)) {
      return res
        .status(400)
        .json(responseGenerator(400, "Invalid UUID format"));
    }

    if (isFileExist(uuid)) {
      return res
        .status(409)
        .json(responseGenerator(409, "Configuration file already exists"));
    }

    const updatedUserConfig = configFiles.update(uuid, type, time);

    if (!updatedUserConfig) {
        return res.status(500).json(responseGenerator(500, "Failed to update user configuration"));
    }

    return res.status(200).json(responseGenerator(200, "User configuration updated successfully", {
        "uuid": uuid,
    }));
});

usersRouter.delete("/config/:uuid", (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;

    if (!verifyRequiredFields(req.params, ["uuid"])) {
      return res
        .status(400)
        .json(responseGenerator(400, "Missing required field: uuid"));
    }

    if (!verifyUuidFormat(uuid)) {
      return res
        .status(400)
        .json(responseGenerator(400, "Invalid UUID format"));
    }

    const uuidFile = deleteFile(uuid);

    if (!uuidFile) {
        return res.status(500).json(responseGenerator(500, "Failed to delete configuration file"));
    }

    const deleteUserConfig = configFiles.delete(uuid);

    if (!deleteUserConfig) {
        return res.status(500).json(responseGenerator(500, "Failed to delete user configuration"));
    }

    return res.status(200).json(responseGenerator(200, "User configuration deleted successfully"));
});

export default usersRouter;