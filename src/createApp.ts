import express from "express";
import type { NextFunction, Request, Response } from "express";
import { allowedIps } from "./utils/envUtil.js";
import { decodeToken } from "./utils/jwtUtil.js";
import usersRouter from "./routers/usersRouter.js";
import configDownloadRouter from "./routers/configDownloadRouter.js";
import activeRouter from "./routers/activeRouter.js";
import serverRouter from "./routers/serverRouter.js";
import getConfigRouter from "./routers/getConfigRouter.js";
import configsRouter from "./routers/configsRouter.js";
import "./extensions/responseGenerator.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "";
    if (!allowedIps().includes(ip)) {
      return res.sendServerJson(403, "IP_ACCESS_DENIED", { ip });
    }
    return next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return res.sendServerJson(405, "METHOD_NOT_ALLOWED");
    }

    if (!["GET", "DELETE"].includes(req.method) && Object.keys(req.body ?? {}).length === 0) {
      return res.sendServerJson(400, "REQUEST_BODY_MISSING");
    }

    if (!req.path.startsWith("/getConfig")) {
      if (!req.headers.authorization) {
        return res.sendServerJson(403, "AUTH_HEADER_MISSING");
      }

      const decodedToken = decodeToken(req.headers.authorization);
      if (!decodedToken) {
        return res.sendServerJson(401, "INVALID_TOKEN_FORMAT");
      }
      (req as any).tokenPayload = decodedToken;
    }

    return next();
  });

  app.use("/api/download", configDownloadRouter);
  app.use("/getConfig", getConfigRouter);
  app.use("/api/config", usersRouter);
  app.use("/api/server", serverRouter);
  app.use("/api/active", activeRouter);
  app.use("/api/configs", configsRouter);

  app.get("/", (_req, res) => {
    res.send("Welcome to the secure server! Use the API endpoints to interact with the server.");
  });

  app.use((req, res) => {
    res.sendServerJson(404, "NOT_FOUND", { method: req.method, path: req.path });
  });

  return app;
}
