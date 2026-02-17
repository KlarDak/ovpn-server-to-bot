import Router from "express";
import type { NextFunction, Request, Response } from "express";
import { responseGenerator } from "../utils/resgenUtil.js";
import { Redis } from "ioredis";
import { actionPath, redisPaths } from "../utils/envUtil.js";
import { verifyUuidFormat } from "../utils/verifyUtil.js";
import { execFile } from "child_process";
import { promisify } from "util";
import { getConnectedClients, kickUser } from "../services/doActionUser.js";
import { configFiles } from "../utils/configUtil.js";
import { stdout } from "process";

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
     return res.status(200).json(responseGenerator(200, "Active users endpoint is working"));
});

activeRouter.post("/list", async (_req: Request, res: Response) => {
  try {
    const clients = await getConnectedClients();

    res.status(200).json({
      date: new Date().toISOString(),
      server_number: 1,
      server_code: "ksd_nl_01",
      count: clients.length,
      active_users: clients,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to get active users",
      details: {
        message: error?.message,
        raw: String(error),
      },
    });
  }
});

activeRouter.post("/kick", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  if (!uuid || !verifyUuidFormat(uuid)) {
    return res
      .status(400)
      .json(responseGenerator(400, "Invalid or missing uuid."));
  }

  try {
    await kickUser(uuid);

    res.status(200).json(responseGenerator(200, "User kicked successfully."));
  } catch (error) {
    res.status(500).json({
      error: "Failed to kick user",
      details: error,
    });
  }
});

activeRouter.post("/ban", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  if (!uuid || !verifyUuidFormat(uuid)) {
    return res
      .status(400)
      .json(responseGenerator(400, "Invalid or missing uuid."));
  }

  try {

    configFiles.update(uuid, 0, "user", true);

    await kickUser(uuid);

    res.status(200).json(responseGenerator(200, "User banned successfully."));
  } catch (error) {
    res.status(500).json({
      error: "Failed to kick user",
      details: error,
    });
  }
});

activeRouter.post("/pardon", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  if (!uuid || !verifyUuidFormat(uuid)) {
    return res
      .status(400)
      .json(responseGenerator(400, "Invalid or missing uuid."));
  }

  try {
    configFiles.update(uuid, 0, "active", false);

    res.status(200).json(responseGenerator(200, "User pardoned successfully."));
  } catch (error) {
    res.status(500).json({
      error: "Failed to pardon user",
      details: error,
    });
  }
});

export default activeRouter;