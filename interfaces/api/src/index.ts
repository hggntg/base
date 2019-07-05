import { UnitOfWork } from "@base-interfaces/database";
import { Express, RequestHandler, RequestHandlerParams, PathParams, Application } from "express-serve-static-core";
import { ILogger } from "@base-interfaces/logger";
import { INamespace } from "@base-interfaces/utilities";

export interface IAPIOptions{
    port: number
}

export interface IAPIMetadata{
    tracer: ILogger;
    classes: {
        [key in string]: {new(db: UnitOfWork): IController};
    }
    db: UnitOfWork;
    context: INamespace;
    options: IAPIOptions;
}

export interface IWorkerMetadata{
    tracer: ILogger
}

export interface IAPI{
    start(): Promise<boolean>;
    useCORS();
    registerMiddleware(path: PathParams, handlers?: RequestHandler, ...restHandlers: RequestHandler[]): Express;
    registerMiddleware(path: PathParams, handlers?: RequestHandlerParams, ...restHandlers: RequestHandlerParams[]): Express;
    registerMiddleware(path: PathParams, subApplication: Application)
    registerMiddleware(handlers: RequestHandler, moreHandlers?: RequestHandler, ...restHandlers: RequestHandler[]): Express;
    registerMiddleware(handlers: RequestHandlerParams, moreHandlers?: RequestHandlerParams, ...restHandlers: RequestHandlerParams[]): Express;
    registerMiddleware(arg0: (RequestHandler | RequestHandlerParams | PathParams), arg1?: (RequestHandler | RequestHandlerParams | Application), ...arg2: (RequestHandler[] | RequestHandlerParams[])): Express;
}

export interface IWorker{
    start(): Promise<boolean>;
}


export interface IExtendAPI{
    apiServer: IAPI;
}

export interface IRoute {
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
}
export interface IControllerMetadata {
    name: string;
    routeBase: string;
    routes: {
        [key: string]: IRoute
    }
    tracer: ILogger
}

export interface IController {
    subApp: Express;
    uowInstance: UnitOfWork;
    logger: ILogger;
}