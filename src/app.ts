import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { allowedIps, serverProps } from './utils/envUtil.js';
import usersRouter from './routers/usersRouter.js';
import { consoleError, responseGenerator } from './utils/resgenUtil.js';
import { decodeToken } from './utils/jwtUtil.js';
import botRouter from './routers/botRouter.js';
import { decodeLink } from './utils/slinkUtil.js';
import { getFile, isFileExist } from './utils/filesUtil.js';

const app = express();

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
    const ip: string = req.ip || "";

    if (!allowedIps().includes(ip)) {
        return res.status(403).json({ error: "Access denied by IP", ip: ip });
    }
    
    next();
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

    next();
});

app.use("/v2.0/users/", usersRouter);
app.use("/v2.0/bot/", botRouter);

app.post("/v2.0/configs/download", async (req: Request, res: Response) => {
    if ((req as any).tokenPayload.type !== "download") {
        return res.status(403).json(responseGenerator(403, "Check your role for this action."));
    }

    if (!/^[A-Za-z0-9]{6}$/.test(req.body.link)) {
        return res.status(400).json(responseGenerator(400, "Invalid link format"));
    }

    const decodedSLink = await decodeLink(req.body.link);

    if (!decodedSLink) {
        return res.status(404).json(responseGenerator(404, "Link not found or expired"));
    }

    if (!isFileExist(decodedSLink)) {
        return res.status(404).json(responseGenerator(404, "Configuration file not found"));
    }

    return res.download(getFile(decodedSLink) as string, `${decodedSLink}.ovpn`, (err) => {
        console.error(consoleError("File Download", err));
    });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the secure server! Use the API endpoints to interact with the server.");
});

app.listen(serverProps().port, serverProps().hostname, () => {
    console.log(`Server running at http://${serverProps().hostname}:${serverProps().port}/`);
});