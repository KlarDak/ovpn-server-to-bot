import Router from "express";
import type { NextFunction, Request, Response } from "express";
import { responseGenerator } from "../utils/resgenUtil.js";
import { verifyUuidFormat } from "../utils/verifyUtil.js";
import { getConnectedClients, kickUser } from "../services/doActionUser.js";
import { configFiles } from "../utils/configUtil.js";
import si from "systeminformation";

const activeRouter = Router();

/**
 * Middleware function to check if the user has the "active" type in their token payload before allowing access to the routes defined in this router. If the user's type is not "active", it responds with a 403 status code and an error message indicating insufficient permissions. If the user has the correct type, it calls the next middleware function or route handler in the stack.
 */
activeRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.type !== "active") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    return next();
});

/**
 * Handle GET requests to the "/status/" endpoint to check the status of various server functions. The route checks if the user has the appropriate "check" type in their token payload, and if so, it attempts to connect to a Redis server, checks for the existence of certain directories, and executes a command to check if the OpenVPN process is active. The results of these checks are compiled into a JSON response indicating the status of each function, along with a timestamp and server information. If any errors occur during the checks, it responds with a 500 status code and an error message.
 */
activeRouter.get("/", async (_, res: Response) => {
     return res.status(200).json(responseGenerator(200, "Active users endpoint is working"));
});

/**
 * Handle POST requests to the "/list" endpoint to retrieve a list of currently connected clients. The route calls the getConnectedClients service function to fetch the list of active users, and then responds with a JSON object containing the current date, server information, the count of active users, and an array of active user details. If any errors occur during the retrieval of active users, it responds with a 500 status code and an error message indicating the failure to get active users.
 */
activeRouter.post("/list", async (_req: Request, res: Response) => {
  try {
    const clients = await getConnectedClients();

    res.status(200).json(responseGenerator(200, "List of active users retrieved successfully", {
      date: new Date().toISOString(),
      server_number: 1,
      server_code: "ksd_nl_01",
      count: clients.length,
      active_users: clients,
    }));
  } catch (error: any) {
    res.status(500).json(responseGenerator(500, "Failed to get active users", {
        message: error?.message,
        raw: String(error),
      }));
  }
});

activeRouter.post("/htop", async (_req: Request, res: Response) => {
  try {
    const [cpu, memory, disk, netStat] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
    ]);

    const net = netStat[0] || null;

    const toKb = (value?: number) =>
      value == null || value < 0 ? null : Number((value / 1024).toFixed(2));

    const incoming = toKb(net?.rx_sec);
    const outgoing = toKb(net?.tx_sec);

    const time = si.time();

    const data = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage_percent: Number(cpu.currentLoad.toFixed(2)),
        avg_load: cpu.avgLoad,
        cores: cpu.cpus?.length ?? 1,
      },
      memory: {
        total_gb: Number((memory.total / 1024 / 1024 / 1024).toFixed(2)),
        used_gb: Number((memory.used / 1024 / 1024 / 1024).toFixed(2)),
        active_gb: Number((memory.active / 1024 / 1024 / 1024).toFixed(2)),
        available_gb: Number(
          (memory.available / 1024 / 1024 / 1024).toFixed(2),
        ),
        free_gb: Number((memory.free / 1024 / 1024 / 1024).toFixed(2)),
        usage_percent: Number(((memory.used / memory.total) * 100).toFixed(2)),
      },
      disk: disk.map((d) => ({
        type: d.type,
        mount: d.mount,
        total_gb: Number((d.size / 1024 / 1024 / 1024).toFixed(2)),
        used_gb: Number((d.used / 1024 / 1024 / 1024).toFixed(2)),
        available_gb: Number((d.available / 1024 / 1024 / 1024).toFixed(2)),
        usage_percent: Number(d.use.toFixed(2)),
      })),
      network: {
        incoming_kb_sec: incoming,
        outgoing_kb_sec: outgoing,
        total_kb_sec:
          incoming != null && outgoing != null
            ? Number((incoming + outgoing).toFixed(2))
            : null,
      },
      uptime_seconds: time.uptime,
    };

    res.json(responseGenerator(200, "System metrics retrieved successfully", data));
  } catch (error) {
    res.status(500).json(responseGenerator(500, "Failed to retrieve system metrics", {
      message: String(error),
    }));
  }
});

/**
 * Handle POST requests to the "/pardon" endpoint to pardon a user based on their UUID. The route expects a JSON payload containing the user's UUID, which is used to identify the user to be pardoned. The function validates the format of the provided UUID, updates the user's configuration to set them as inactive, and responds with a success message if the operation is successful. If the UUID is invalid or missing, it responds with a 400 status code and an error message. If any errors occur during the pardoning process, it responds with a 500 status code and an error message.
 */
activeRouter.post("/kick", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  if (!uuid || !verifyUuidFormat(uuid)) {
    return res
      .status(400)
      .json(responseGenerator(400, "Invalid or missing uuid."));
  }

  try {
    await kickUser(uuid);

    return res.status(200).json(responseGenerator(200, "User kicked successfully."));
  } catch (error) {
    return res.status(500).json(responseGenerator(500, "Failed to kick user", {
        info: error,
      }));
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

    return res.status(200).json(responseGenerator(200, "User banned successfully."));
  } catch (error) {
    return res.status(500).json(responseGenerator(500, "Failed to ban user", {
        info: error,
      }));
  }
});

/**
 * Handle POST requests to pardon a user based on their UUID. The route expects a JSON payload containing the user's UUID, which is used to identify the user to be pardoned. The function checks if the provided UUID is valid, and if so, it updates the user's configuration to set them as active and not banned. If the operation is successful, it responds with a success message; otherwise, it responds with an error message indicating the failure of the operation.
 */
activeRouter.post("/pardon", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  if (!uuid || !verifyUuidFormat(uuid)) {
    return res
      .status(400)
      .json(responseGenerator(400, "Invalid or missing uuid."));
  }

  try {
    configFiles.update(uuid, 0, "active", false);

    return res.status(200).json(responseGenerator(200, "User pardoned successfully."));
  } catch (error) {
    return res.status(500).json(responseGenerator(500, "Failed to pardon user", {
        info: error,
      }));
    }
});

export default activeRouter;