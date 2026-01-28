import Router from 'express';
import type { NextFunction, Request, Response } from 'express';
import RedisUtil from '../utils/redisUtil.js';
import { responseGenerator } from '../utils/resgenUtil.js';
import { isDirExists } from '../utils/filesUtil.js';
import { pathDirs, redisPaths } from '../utils/envUtil.js';
import { configFiles } from '../utils/configUtil.js';
import { exec } from "child_process";
import { Redis } from 'ioredis';

const botRouter = Router();

botRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.role !== "bot") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    next();
});

botRouter.get("/status/", async (req: Request, res: Response) => {
    if ((req as any).tokenPayload.type !== "check") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }
    
    try {
        const redisConnect = new RedisUtil(redisPaths().hostname, redisPaths().port);
        await redisConnect.connect();
        
        const redisStatus: boolean = (await redisConnect.ping() === "PONG") ? true : false;
        const ovpnDirExists: boolean = isDirExists();
        console.log(pathDirs().configDir);
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

botRouter.get("/active", async(req: Request, res: Response) => {
    if ((req as any).tokenPayload.type !== "check") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }
    
    const redis = new Redis({ host: redisPaths().hostname, port: redisPaths().port });

    try {
      let keys: string[] = [];
      let cursor = 0;

      do {
        const [nextCursor, found] = await redis.scan(
          cursor,
          "MATCH",
          "active:*",
          "COUNT",
          100,
        );
        cursor = Number(nextCursor);
        keys.push(...found);
      } while (cursor !== 0);

      res.status(200).json({
        date: new Date().toISOString(),
        server_number: 1,
        server_code: "ksd_nl_01",
        active_users: keys.length
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to get active users", details: error });
    }
});

botRouter.post("/config", (req: Request, res: Response) => {
    
});

export default botRouter;