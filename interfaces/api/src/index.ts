import { IController } from "./main/controller";
import { UnitOfWork } from "@base/interfaces";
import { Express, RequestHandler, RequestHandlerParams, PathParams } from "express-serve-static-core";

export interface IExtendApi{
    server?: Express;
    setLogForApi?(hasLog: boolean);
    startServer?(port: number, unitOfWorkInstance: UnitOfWork, controllers: {[key: string]: { new(unitOfWorkInstance: UnitOfWork) : IController} }): Promise<boolean>;
    setResponseTemplate?();
    useCORS?();
    registerMiddleware?(handlers: RequestHandler[]): Express;
    registerMiddleware?(path: PathParams,handlers: RequestHandler[]): Express;
    registerMiddleware?(handlers: RequestHandlerParams[]): Express;
    registerMiddleware?(path: PathParams,handlers: RequestHandlerParams[]): Express;
    registerMiddleware?(arg0: (RequestHandler[] | RequestHandlerParams[] | PathParams), arg1?: (RequestHandler[] | RequestHandlerParams[])): Express;
}