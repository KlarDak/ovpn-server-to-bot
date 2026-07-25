import express from 'express';
import type { IResponseConfig } from '../interfaces/IResponseArray.js';
import { responseGenerator } from '../utils/resgenUtil.js';

declare global {
    namespace Express {
        interface Response {
          sendServerJson(inputData: IResponseConfig | number, message?: string, data?: any): this;
        }
    }

    interface Console {
        serverError(module: string, error: any): void;
    }
}

express.response.sendServerJson = function (inputData: IResponseConfig | number, message?: string, data?: any) {
    if (typeof inputData === "object") {
        return this.status(inputData.code).json(inputData);
    }
    else if (typeof inputData === "number") {
        if (typeof message === "string") {
            return this.status(inputData).json(responseGenerator(inputData, message, data));
        }
    }
    
    console.serverError("responseGenerator", "Error with response generation.");
    return this.status(500).json(responseGenerator(500, "RESPONSE_GENERATION_FAILED"));
}

console.serverError = function(module: string, error: any){
    console.error(`An error has occurred in module ${module} at ${new Date().toISOString()}. Error: ${error}`);
}