import { Router } from "express";
import type { Request, Response } from "express";
import { responseGenerator } from "../utils/resgenUtil.js";
import { decodeLink } from "../utils/slinkUtil.js";
import { isFileExist, getFile } from "../utils/filesUtil.js";

const configDownloadRouter = Router();

configDownloadRouter.post("/download", async (req: Request, res: Response) => {
  if ((req as any).tokenPayload.type !== "download") {
    return res
      .status(403)
      .json(responseGenerator(403, "Check your role for this action."));
  }

  if (!/^[A-Za-z0-9]{6}$/.test(req.body.link)) {
    return res.status(400).json(responseGenerator(400, "Invalid link format"));
  }

  const decodedSLink = await decodeLink(req.body.link);

  if (!decodedSLink) {
    return res
      .status(404)
      .json(responseGenerator(404, "Link not found or expired"));
  }

  if (!isFileExist(decodedSLink)) {
    return res
      .status(404)
      .json(responseGenerator(404, "Configuration file not found"));
  }

  return res.download(getFile(decodedSLink) as string, `${decodedSLink}.ovpn`);
});

export default configDownloadRouter;