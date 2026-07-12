import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { allowedIps, serverProps } from './utils/envUtil.js';
import usersRouter from './routers/usersRouter.js';
import { responseGenerator } from './utils/resgenUtil.js';
import { decodeToken } from './utils/jwtUtil.js';
import configDownloadRouter from './routers/configDownloadRouter.js';
import activeRouter from './routers/activeRouter.js';
import serverRouter from "./routers/serverRouter.js";
import './extensions/responseGenerator.js';

const app = express();

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
    const ip: string = req.ip || "";

    if (!allowedIps().includes(ip)) {
        return res.status(403).json({ error: "Access denied by IP", ip: ip });
    }
    
    return next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return res.sendServerJson(405, "METHOD_NOT_ALLOWED");
    }
    
    if (!["GET", "DELETE"].includes(req.method) && Object.keys(req.body ?? []).length === 0) {
        return res.sendServerJson(400, "REQUEST_BODY_MISSING");
    }

    if (!req.headers.authorization) {
        return res.sendServerJson(403, "AUTH_HEADER_MISSING");
    }

    const decodedToken = decodeToken(req.headers.authorization as string);
    
    if (!decodedToken) {
        return res.sendServerJson(401, "INVALID_TOKEN_FORMAT");
    }

    (req as any).tokenPayload = decodedToken;

    return next();
});

app.use("/api/download/", configDownloadRouter);
app.use("/api/config/", usersRouter);
app.use("/api/server/", serverRouter);
app.use("/api/active/", activeRouter);

app.get("/", (_, res: Response) => {
  res.send("Welcome to the secure server! Use the API endpoints to interact with the server.");
});

app.listen(serverProps().port, serverProps().hostname, () => {
    console.log(`Server running at http://${serverProps().hostname}:${serverProps().port}/`);
});