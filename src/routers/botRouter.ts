import Router from 'express';
import type { NextFunction, Request, Response } from 'express';
import RedisUtil from '../utils/redisUtil.js';
import { responseGenerator } from '../utils/resgenUtil.js';
import { isDirExists } from '../utils/filesUtil.js';
import { redisPaths } from '../utils/envUtil.js';
import { configFiles } from '../utils/configUtil.js';
import { exec } from "child_process";
import { deleteUserConfig, getUserConfig, patchUserConfig, postUserConfig, putUserConfig } from '../services/configsServices.js';
import activeRouter from './activeRouter.js';

const botRouter = Router();

botRouter.use("/active", activeRouter);

/**
 * Send a command to the OpenVPN management interface and retrieve the response as a string. The function establishes a connection to the management interface using the specified host and port, sends the provided command followed by a "quit" command to terminate the session, and listens for data events to accumulate the response in a buffer. If any errors occur during the connection or communication process, the promise is rejected with the error. Once the connection is closed, the accumulated response is resolved as a string.
 */
botRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.role !== "bot") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    return next();
});

/**
 * Handle GET requests to the "/status/" endpoint to check the status of various server functions. The route checks if the user has the appropriate "check" type in their token payload, and if so, it attempts to connect to a Redis server, checks for the existence of certain directories, and executes a command to check if the OpenVPN process is active. The results of these checks are compiled into a JSON response indicating the status of each function, along with a timestamp and server information. If any errors occur during the checks, it responds with a 500 status code and an error message.
 */
botRouter.get("/status/", async (req: Request, res: Response) => {
    if ((req as any).tokenPayload.type !== "check") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }
    
    try {
        const redisConnect = new RedisUtil(redisPaths().hostname, redisPaths().port);
        await redisConnect.connect();
        
        configFiles.createTable();
        const redisStatus: boolean = (await redisConnect.ping() === "PONG") ? true : false;
        const ovpnDirExists: boolean = isDirExists();
        const configsDirExists: boolean = await configFiles.isExists();

        return exec("pgrep openvpn", (error, stdout) => {
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
        return res.status(500).json(responseGenerator(500, "Error to set something data", error));
    }
});

/**
 * Handle POST requests to the "/config" endpoint to manage user configurations based on the type specified in the token payload. The route checks if the user has one of the allowed types ("get", "create", "recreate", "update", "delete") in their token payload, and if so, it processes the request body to perform the corresponding action on user configurations using the appropriate service functions. The result of the action is then returned in the response with the appropriate status code and JSON data indicating the success or failure of the operation. If the request type is invalid or if required fields are missing, it responds with a 403 status code and an error message.
 */
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