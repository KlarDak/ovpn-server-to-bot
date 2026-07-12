import { Router } from "express";
import type { Request, Response } from "express";
import { decodeLink } from "../utils/slinkUtil.js";
import { isFileExist, getFile } from "../utils/filesUtil.js";
import { verifyShortLink } from "../utils/verifyUtil.js";

const configDownloadRouter = Router();

/**
 * Handle POST requests to download a configuration file based on a provided link in the request body. The route checks if the user has the appropriate "download" type in their token payload, validates the format of the provided link, decodes the link to retrieve the corresponding configuration identifier, checks if the configuration file exists, and if all checks pass, it initiates the download of the configuration file with a filename based on the decoded identifier. If any of the checks fail (e.g., invalid role, invalid link format, link not found, or file not found), it responds with the appropriate status code and error message indicating the reason for the failure.
 */
configDownloadRouter.get("/:shortlink", async (req: Request, res: Response) => {
  if (!(req as any).tokenPayload.role.includes("site")) {
    return res.sendServerJson(403, "INVALID_USER_ROLE");
  }

  if (verifyShortLink(req.body.link)) {
    return res.sendServerJson(400, "INVALID_LINK_FORMAT");
  }

  const decodedSLink = await decodeLink(req.body.link);

  if (!decodedSLink) {
    return res.sendServerJson(404, "LINK_EXPIRED_OR_NOT_FOUND");
  }

  if (!isFileExist(decodedSLink)) {
    return res.sendServerJson(404, "CONFIG_FILE_NOT_FOUND");
  }

  return res.download(getFile(decodedSLink) as string, `${decodedSLink}.ovpn`);
});

export default configDownloadRouter;