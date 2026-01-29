import Router from 'express';
import type { Request, Response, NextFunction } from 'express';
import { responseGenerator } from '../utils/resgenUtil.js';
import { deleteUserConfig, getUserConfig, patchUserConfig, postUserConfig, putUserConfig } from '../services/configsServices.js';

const usersRouter = Router();

usersRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.role !== "user") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    next();
});

usersRouter.get("/config/:uuid", (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;
    const getConfig = getUserConfig(uuid);

    return res.status(getConfig.code).json(getConfig);
});

// Запрос на создание конфигурационного файла пользователя
// В body: uuid - имя пользователя, type - тип пользователя,  time - время работы конфиг-файла
usersRouter.post("/config", async (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;
    const postConfig = await postUserConfig(uuid, type, time);

    return res.status(postConfig.code).json(postConfig);
});

usersRouter.put("/config", async (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;
    const putConfig = await putUserConfig(uuid, type, time);

    return res.status(putConfig.code).json(putConfig);
});

usersRouter.patch("/config", (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;
    
    const patchConfig = patchUserConfig(uuid, type, time);

    return res.status(200).json(responseGenerator(200, "User configuration updated successfully", {
        "uuid": uuid,
    }));
});

usersRouter.delete("/config/:uuid", (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;

    const deleteConfig = deleteUserConfig(uuid);

    return res.status(deleteConfig.code).json(deleteConfig);
});

export default usersRouter;