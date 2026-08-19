import Router from "express";
import type { NextFunction, Request, Response } from "express";
import { verifyUuidFormat } from "../utils/verifyUtil.js";
import { getConnectedClients, kickUser } from "../services/doActionUser.js";
import { configFiles } from "../utils/configUtil.js";
import { subIndex } from "../utils/envUtil.js";

const activeRouter = Router();

/**
 * Middleware function to check if the user has the "active" type in their token payload before allowing access to the routes defined in this router. If the user's type is not "active", it responds with a 403 status code and an error message indicating insufficient permissions. If the user has the correct type, it calls the next middleware function or route handler in the stack.
 */
activeRouter.use((req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).tokenPayload.role.includes("admin")) {
        return res.sendServerJson(403, "INSUFFICIENT_PERMISSIONS");
    }

    if (req.method === "POST") {
      if (!req.body.uuid || !verifyUuidFormat(req.body.uuid)) {
        return res.sendServerJson(400, "INVALID_UUID");
      }
    }

    return next();
});

/**
 * Handle GET requests to the "/status/" endpoint to check the status of various server functions. The route checks if the user has the appropriate "check" type in their token payload, and if so, it attempts to connect to a Redis server, checks for the existence of certain directories, and executes a command to check if the OpenVPN process is active. The results of these checks are compiled into a JSON response indicating the status of each function, along with a timestamp and server information. If any errors occur during the checks, it responds with a 500 status code and an error message.
 */
activeRouter.get("/", async (_, res: Response) => {
     return res.sendServerJson(200, "Active users endpoint is working");
});

/**
 * Handle GET requests to the "/list" endpoint to retrieve a list of currently connected clients. The route calls the getConnectedClients service function to fetch the list of active users, and then responds with a JSON object containing the current date, server information, the count of active users, and an array of active user details. If any errors occur during the retrieval of active users, it responds with a 500 status code and an error message indicating the failure to get active users.
 */
activeRouter.get("/list", async (_, res: Response) => {
  try {
    const clients = await getConnectedClients();

    const serverStatus = {
      date: new Date().toISOString(),
      server_number: 1,
      server_code: subIndex(),
      count: clients.length ?? 0,
      active_users: clients,
    };

    return res.sendServerJson(200, "ACTIVE_USERS_RETRIEVED", serverStatus);
  } catch (error: any) {
    console.serverError("activeRouter", error);
    return res.sendServerJson(500, "ACTIVE_USERS_FETCH_FAILED", {
      message: error?.message,
      raw: String(error),
    });
  }
});

/**
 * Handle POST requests to the "/pardon" endpoint to pardon a user based on their UUID. The route expects a JSON payload containing the user's UUID, which is used to identify the user to be pardoned. The function validates the format of the provided UUID, updates the user's configuration to set them as inactive, and responds with a success message if the operation is successful. If the UUID is invalid or missing, it responds with a 400 status code and an error message. If any errors occur during the pardoning process, it responds with a 500 status code and an error message.
 */
activeRouter.post("/kick", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  try {
    await kickUser(uuid);
    await configFiles.update(uuid, {status: "inactive"});

    return res.sendServerJson(200, "USER_KICKED");
  } catch (error) {
    console.serverError("activeRouter", error);
    return res.sendServerJson(500, "USER_KICK_FAILED", {info: error});
  }
});

activeRouter.post("/ban", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  try {
    await configFiles.update(uuid, {status: "banned"});

    await kickUser(uuid);

    return res.sendServerJson(200, "USER_BANNED");
  } catch (error) {
    console.serverError("activeRouter", error);
    return res.sendServerJson(500, "USER_BAN_FAILED", {
      info: error
    });
  }
});

/**
 * Handle POST requests to pardon a user based on their UUID. The route expects a JSON payload containing the user's UUID, which is used to identify the user to be pardoned. The function checks if the provided UUID is valid, and if so, it updates the user's configuration to set them as active and not banned. If the operation is successful, it responds with a success message; otherwise, it responds with an error message indicating the failure of the operation.
 */
activeRouter.post("/pardon", async (req: Request, res: Response) => {
  const { uuid } = req.body;

  try {
    await configFiles.update(uuid, {status: "active"});

    return res.sendServerJson(200, "USER_PARDONNED");
  } catch (error) {
    console.serverError("activeRouter", error);
    return res.sendServerJson(500, "USER_PARDON_FAILED", {
      info: error
    });
    }
});

export default activeRouter;
