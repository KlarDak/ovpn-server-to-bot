import Router from 'express';
import type { NextFunction, Request, Response } from 'express';
import RedisUtil from '../utils/redisUtil.js';
import { responseGenerator } from '../utils/resgenUtil.js';
import { isDirExists } from '../utils/filesUtil.js';
import { pathDirs, redisPaths } from '../utils/envUtil.js';
import { configFiles } from '../utils/configUtil.js';
import { exec } from "child_process";
import { Redis } from 'ioredis';
import { deleteUserConfig, getUserConfig, patchUserConfig, postUserConfig, putUserConfig } from '../services/configsServices.js';
import activeRouter from './activeRouter.js';

const botRouter = Router();

botRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.role !== "bot") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    next();
});

botRouter.use("/active", activeRouter);

botRouter.get("/status/", async (req: Request, res: Response) => {
    if ((req as any).tokenPayload.type !== "check") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }
    
    try {
        const redisConnect = new RedisUtil(redisPaths().hostname, redisPaths().port);
        await redisConnect.connect();
        
        const redisStatus: boolean = (await redisConnect.ping() === "PONG") ? true : false;
        const ovpnDirExists: boolean = isDirExists();
        const configsDirExists: boolean = configFiles.is_dir_exists(pathDirs().usersDir);

        exec("pgrep openvpn", (error, stdout, stderr) => {
            const isOVPNActive = !error && stdout.trim() ? true : false;

            return res.status(200).json(responseGenerator(200, "Set status of all server's functions", {
                date: new Date().toISOString(),
                server_number: 1,
                server_code: "ksd_nl_01",
                isServerWorking: true,
                isRedisRunning: redisStatus,
                isOVPNDirExists: ovpnDirExists,
                isConfigsDirExists: configsDirExists,
                isOVPNActive: isOVPNActive,
            }));
        });
    } 
    catch (error) {
        res.status(500).json(responseGenerator(500, "Error to set something data", error));
    }
});

botRouter.post("/config", async (req: Request, res: Response) => {
    const reqType = (req as any).tokenPayload.type as string;
    
    if (!["get", "create", "recreate", "update", "delete"].includes(reqType)) {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    const {uuid, type, time} = req.body;

    if (!uuid) {
        return res.status(403).json(responseGenerator(403, "Access denied: missing required field uuid."));
    }

    let result;

    switch (reqType) {
        case "get":
            result = getUserConfig(uuid);
            break;
        case "create":
            result = await postUserConfig(uuid, type, time);
            break;
        case "recreate":
            result = await putUserConfig(uuid, type, time);
            break;
        case "update":
            result = await patchUserConfig(uuid, type, time);
            break;
        case "delete":
            result = deleteUserConfig(uuid);
            break;
        default:
            return responseGenerator(400, "Invalid request type");
    }

    return res.status(result.code).json(result);

});

export default botRouter;