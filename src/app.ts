import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { allowedIps, serverProps } from './utils/envUtil.js';
import usersRouter from './routers/usersRouter.js';
import { responseGenerator } from './utils/resgenUtil.js';
import { decodeToken } from './utils/jwtUtil.js';
import botRouter from './routers/botRouter.js';
import configDownloadRouter from './routers/configDownloadRouter.js';

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
        return res
          .status(405)
          .json(responseGenerator(405, "Method Not Allowed"));
    }
    
    if (!["GET", "DELETE"].includes(req.method) && Object.keys(req.body ?? []).length === 0) {
        return res
          .status(400)
          .json(responseGenerator(400, "Request body is missing"));
    }

    if (!req.headers.authorization) {
        return res
          .status(401)
          .json(responseGenerator(403, "Authorization header missing"));
    }

    const decodedToken = decodeToken(req.headers.authorization as string);
    
    if (!decodedToken) {
        return res.status(401).json(responseGenerator(401, "Invalid authorization token format"));
    }

    (req as any).tokenPayload = decodedToken;

    return next();
});

app.use("/v2.0/configs/", configDownloadRouter);
app.use("/v2.0/users/", usersRouter);
app.use("/v2.0/bot/", botRouter);

app.get("/", (_, res: Response) => {
  res.send("Welcome to the secure server! Use the API endpoints to interact with the server.");
});

app.listen(serverProps().port, serverProps().hostname, () => {
    console.log(`Server running at http://${serverProps().hostname}:${serverProps().port}/`);
});