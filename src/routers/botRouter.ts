import Router from 'express';
import type { Request, Response } from 'express';

const botRouter = Router();

botRouter.get("/status", (req: Request, res: Response) => {

});

botRouter.post("/config", (req: Request, res: Response) => {
    
});

export default botRouter;