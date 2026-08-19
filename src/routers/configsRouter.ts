import Router from 'express';
import type { NextFunction, Request, Response } from 'express';
import { verifyUuidFormat } from '../utils/verifyUtil.js';
import { configFiles } from '../utils/configUtil.js';

const configsRouter = Router();

configsRouter.use((req: Request, res: Response, next: NextFunction) => {
    if (!["admin", "bot"].includes((req as any).tokenPayload.role)) {
      return res.sendServerJson(403, "INSUFFICIENT_PERMISSIONS");
    }

    return next();
});

configsRouter.patch("/", async (req: Request, res: Response) => {
    try {
        const { uuids, type, time, status } = req.body;

        if (!Array.isArray(uuids)) {
            return res.sendServerJson(400, "MISSING_UUIDS_REQUEST");
        }

        if (type === undefined && time === undefined && status === undefined) {
            return res.sendServerJson(400, "MISSING_REQUIRED_FIELDS");
        }

        if (type !== undefined && (typeof type !== "string" || !["user", "unlimit", "unblocked"].includes(type))) {
            return res.sendServerJson(400, "INVALID_TYPE_OR_CONTENT");
        }

        if (time !== undefined && (typeof time !== "number" || time <= 0)) {
            return res.sendServerJson(400, "INVALID_TIME_OR_CONTENT");
        }

        if (status !== undefined && !["active", "inactive", "banned"].includes(status)) {
            return res.sendServerJson(400, "INVALID_STATUS_OR_CONTENT");
        }

        const validUuids = uuids.filter((uuid) => verifyUuidFormat(uuid) !== false);

        const updateConfigs = await configFiles.updateAll({
        ...(type !== undefined ? { user_type: type } : {}),
        ...(time !== undefined ? { time } : {}),
        ...(status !== undefined ? { status } : {})
        }, validUuids);

        if (updateConfigs) {
            return res.sendServerJson(201, "UUIDS_CONFIGURATION_UPDATED");
        }
        else {
            return res.sendServerJson(500, "DATABASE_RECORD_UPDATE_FAILED");
        }
    }
    catch (error) {
        console.serverError("configRouter", error);
        return res.sendServerJson(500, "DATABASE_RECORD_UPDATE_FAILED");
    }
});

configsRouter.delete("/", async (req: Request, res: Response) => {
    try {
        const uuids = req.body.uuids;

        if (!Array.isArray(uuids)) {
        return res.sendServerJson(400, "MISSING_UUIDS_REQUEST");
        }

        const validUuids = uuids.filter((uuid) => verifyUuidFormat(uuid) !== false);
        const deleteConfigs = await configFiles.deleteAll(validUuids);

        if (deleteConfigs) {
            return res.sendServerJson(204, "UUIDS_CONFIGURATION_DELETED");
        }
        else {
            return res.sendServerJson(500, "DATABASE_RECORD_DELETE_FAILED");
        }
    }
    catch (error) {
        console.serverError("configRouter", error);
        return res.sendServerJson(500, "DATABASE_RECORD_UPDATE_FAILED");
    }
});

export default configsRouter;