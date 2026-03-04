import Router from 'express';
import type { Request, Response, NextFunction } from 'express';
import { responseGenerator } from '../utils/resgenUtil.js';
import { deleteUserConfig, getUserConfig, patchUserConfig, postUserConfig, putUserConfig } from '../services/configsServices.js';

const usersRouter = Router();

/**
 * Middleware function to check if the user has the "user" role before allowing access to the routes defined in this router. If the user's role is not "user", it responds with a 403 status code and an error message indicating insufficient permissions. If the user has the correct role, it calls the next middleware function or route handler in the stack.
 */
usersRouter.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).tokenPayload.role !== "user") {
        return res.status(403).json(responseGenerator(403, "Access denied: insufficient permissions. Change endpoint or use an admin token."));
    }

    return next();
});


/**
 * Handle GET requests to retrieve the configuration for a specific user based on their UUID. The route expects a UUID parameter in the URL, which is used to identify the user whose configuration is being requested. The function calls the getUserConfig service with the provided UUID, retrieves the user's configuration, and responds with the appropriate status code and JSON data containing the configuration details or an error message if the retrieval fails.
 */
usersRouter.get("/config/:uuid", (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;
    const getConfig = getUserConfig(uuid);

    return res.status(getConfig.code).json(getConfig);
});

/**
 * Handle POST requests to create a new user configuration based on the provided UUID, type, and time in the request body. The route expects a JSON payload containing the user's UUID, the type of configuration, and the time duration for the configuration. The function calls the postUserConfig service with the provided data, creates a new user configuration, and responds with the appropriate status code and JSON data indicating the success or failure of the operation.
 */
usersRouter.post("/config", async (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;
    const postConfig = await postUserConfig(uuid, type, time);

    return res.status(postConfig.code).json(postConfig);
});

/**
 * Handle PUT requests to update an existing user configuration based on the provided UUID, type, and time in the request body. The route expects a JSON payload containing the user's UUID, the new type of configuration, and the new time duration for the configuration. The function calls the putUserConfig service with the provided data, updates the existing user configuration, and responds with the appropriate status code and JSON data indicating the success or failure of the operation.
 */
usersRouter.put("/config", async (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;
    const putConfig = await putUserConfig(uuid, type, time);

    return res.status(putConfig.code).json(putConfig);
});

/**
 * Handle PATCH requests to partially update an existing user configuration based on the provided UUID, type, and time in the request body. The route expects a JSON payload containing the user's UUID, the type of configuration to be updated, and the new time duration for that configuration. The function calls the patchUserConfig service with the provided data, updates the specified fields in the existing user configuration, and responds with the appropriate status code and JSON data indicating the success or failure of the operation.
 */
usersRouter.patch("/config", (req: Request, res: Response) => {
    const { uuid, type, time } = req.body;
    
    patchUserConfig(uuid, type, time);

    return res.status(200).json(responseGenerator(200, "User configuration updated successfully", {
        "uuid": uuid,
    }));
});

/**
 * Handle DELETE requests to remove a user configuration based on the provided UUID in the URL parameter. The route expects a UUID parameter in the URL, which is used to identify the user whose configuration is being deleted. The function calls the deleteUserConfig service with the provided UUID, deletes the user's configuration, and responds with the appropriate status code and JSON data indicating the success or failure of the operation.
 */
usersRouter.delete("/config/:uuid", (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;

    const deleteConfig = deleteUserConfig(uuid);

    return res.status(deleteConfig.code).json(deleteConfig);
});

export default usersRouter;