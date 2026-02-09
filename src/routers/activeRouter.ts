import Router from "express";
import type { NextFunction, Request, Response } from "express";
import { responseGenerator } from "../utils/resgenUtil.js";
import { Redis } from "ioredis";
import { actionPath, redisPaths } from "../utils/envUtil.js";
import { verifyUuidFormat } from "../utils/verifyUtil.js";
import { execFile } from "child_process";
import { promisify } from "util";

const activeRouter = Router();

const execFileAsync = promisify(execFile);

const redis = new Redis({
    host: redisPaths().hostname,
    port: redisPaths().port,
});

activeRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.type !== "active") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    next();
});

activeRouter.get("/", async (req: Request, res: Response) => {
     const redis = new Redis({
       host: redisPaths().hostname,
       port: redisPaths().port,
     });

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
         active_users: keys.length,
       });
     } catch (error) {
       res
         .status(500)
         .json({ error: "Failed to get active users", details: error });
     }
});

activeRouter.post("/list", async (req: Request, res: Response) => {
    const redis = new Redis({
        host: redisPaths().hostname,
        port: redisPaths().port,
    });

    try {
        let keys: string[] = [];
        let cursor = 0;

        const [nextCursor, found] = await redis.scan(
          0,
          "MATCH",
          "active:*",
          "COUNT",
          100,
        );
        cursor = Number(nextCursor);
        keys.push(...found);

        const activeUsers = await Promise.all(
            keys.map(async (key) => {
                const data = await redis.get(key);
                return {key: key.replace("active:", ""), data: JSON.parse(data || "{}") };
            }),
        );
        res.status(200).json({ active_users: activeUsers });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to get active users", details: error });
    }
});

activeRouter.post("/kick", async (req: Request, res: Response) => {
    const { uuid } = req.body;

    if (!uuid || !verifyUuidFormat(uuid)) {
        return res.status(400).json(responseGenerator(400, "Invalid or missing uuid in request body."));
    }

    try {

        const { stdout } = await execFileAsync(actionPath(), ["kick", uuid]);

        if (stdout.trim() !== "OK") {
            return res.status(500).json(responseGenerator(500, "Failed to kick user: action script error", { details: stdout }));
        }

        const key = `active:${uuid}`;
        const exists = await redis.exists(key);
        if (!exists) {
            return res.status(404).json(responseGenerator(404, "User not found or not active."));
        }

        await redis.del(key);
        res.status(200).json(responseGenerator(200, "User kicked successfully."));
    } catch (error) {
        res.status(500).json({ error: "Failed to kick user", details: error });
    }
});

activeRouter.post("/ban", async (req: Request, res: Response) => {
    const { uuid } = req.body;

    if (!uuid || !verifyUuidFormat(uuid)) {
        return res.status(400).json(responseGenerator(400, "Invalid or missing uuid in request body."));
    }

    try {
        const { stdout } = await execFileAsync(actionPath(), ["ban", uuid]);

        if (stdout.trim() !== "OK") {
            return res.status(500).json(responseGenerator(500, "Failed to ban user: action script error", { details: stdout }));
        }

        const key = `active:${uuid}`;
        const exists = await redis.exists(key);
        if (exists) {
            await redis.del(key);
        }
        res.status(200).json(responseGenerator(200, "User banned successfully."));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to ban user", details: error });
    }
});

activeRouter.post("/pardon", async (req: Request, res: Response) => {
    const { uuid } = req.body;

    if (!uuid || !verifyUuidFormat(uuid)) {
      return res
        .status(400)
        .json(
          responseGenerator(400, "Invalid or missing uuid in request body."),
        );
    }

    try {
      const { stdout } = await execFileAsync(actionPath(), ["pardon", uuid]);

      if (stdout.trim() !== "OK") {
        return res
          .status(500)
          .json(
            responseGenerator(500, "Failed to ban user: action script error", {
              details: stdout,
            }),
          );
      }

      const key = `active:${uuid}`;
      const exists = await redis.exists(key);
      if (exists) {
        await redis.del(key);
      }
      res.status(200).json(responseGenerator(200, "User banned successfully."));
    } catch (error) {
      res.status(500).json({ error: "Failed to ban user", details: error });
    }
});

export default activeRouter;