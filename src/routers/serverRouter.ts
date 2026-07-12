import Router from 'express';
import type { NextFunction, Request, Response } from 'express';
import RedisUtil from '../utils/redisUtil.js';
import { isDirExists } from '../utils/filesUtil.js';
import { redisPaths } from '../utils/envUtil.js';
import { configFiles } from '../utils/configUtil.js';
import { exec } from "child_process";
import si from "systeminformation";

const serverRouter = Router();

/**
 * Send a command to the OpenVPN management interface and retrieve the response as a string. The function establishes a connection to the management interface using the specified host and port, sends the provided command followed by a "quit" command to terminate the session, and listens for data events to accumulate the response in a buffer. If any errors occur during the connection or communication process, the promise is rejected with the error. Once the connection is closed, the accumulated response is resolved as a string.
 */
serverRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (!["admin"].includes((req as any).tokenPayload.role)) {
    return res.sendServerJson(403, "INSUFFICIENT_PERMISSIONS");
  }

  return next();
});

/**
 * Handle GET requests to the "/status/" endpoint to check the status of various server functions. The route checks if the user has the appropriate "check" type in their token payload, and if so, it attempts to connect to a Redis server, checks for the existence of certain directories, and executes a command to check if the OpenVPN process is active. The results of these checks are compiled into a JSON response indicating the status of each function, along with a timestamp and server information. If any errors occur during the checks, it responds with a 500 status code and an error message.
 */
serverRouter.get("/status/", async (_, res: Response) => {
  try {
    const redisConnect = new RedisUtil(
      redisPaths().hostname,
      redisPaths().port,
    );
    await redisConnect.connect();

    configFiles.createTable();
    const redisStatus: boolean =
      (await redisConnect.ping()) === "PONG" ? true : false;
    const configsDirExists: boolean = isDirExists();
    const configsDBExists: boolean = await configFiles.isExists();

    return exec("pgrep openvpn", (error, stdout) => {
      const isOVPNActive = !error && stdout.trim() ? true : false;
      const serverStatus = {
        date: new Date().toISOString(),
        server_number: 1,
        server_code: "ksd_nl_01",
        isServerWorking: true,
        isRedisRunning: redisStatus,
        isConfigsDirExists: configsDirExists,
        isConfigsDBExists: configsDBExists,
        isOVPNActive: isOVPNActive,
      };

      return res.sendServerJson(
        200,
        "SERVER_FUNCTIONS_STATUS_SET",
        serverStatus,
      );
    });
  } catch (error) {
    return res.sendServerJson(500, "SERVER_STATE_FETCH_FAILED", error);
  }
});

serverRouter.get("/metrics", async (_req: Request, res: Response) => {
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
    const mainDisk = disk.find((d) => d.mount === "/") || disk[0];
    const serverLoads = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage_percent: Number(cpu.currentLoad.toFixed(2)),
        avg_load: cpu.avgLoad,
        cores: cpu.cpus?.length ?? 1,
      },
      memory: {
        total_gb: Number((memory.total / 1024 / 1024 / 1024).toFixed(2)),
        active_gb: Number((memory.active / 1024 / 1024 / 1024).toFixed(2)),
        free_gb: Number((memory.free / 1024 / 1024 / 1024).toFixed(2)),
        usage_percent: Number(((memory.used / memory.total) * 100).toFixed(2)),
      },
      disk: {
        total_gb: mainDisk
          ? Number((mainDisk.size / 1024 / 1024 / 1024).toFixed(2))
          : null,
        used_gb: mainDisk
          ? Number((mainDisk.used / 1024 / 1024 / 1024).toFixed(2))
          : null,
        available_gb: mainDisk
          ? Number((mainDisk.available / 1024 / 1024 / 1024).toFixed(2))
          : null,
        usage_percent: mainDisk
          ? Number(((mainDisk.used / mainDisk.size) * 100).toFixed(2))
          : null,
      },
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

    res.sendServerJson(200, "METRICS_RETRIEVED", serverLoads);
  } catch (error) {
    res.sendServerJson(500, "SERVER_STATE_FETCH_FAILED", error);
  }
});

export default serverRouter;