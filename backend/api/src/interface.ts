import { INamespace } from "@base/class/interface";
import { RequestHandler, RequestHandlerParams, Express } from "express-serve-static-core";
import { Request, Response, NextFunction } from "express";

export interface IAPIOptions {
    port: number
}

export interface IAPIMetadata {
    classes: {
        [key in string]: { new(): IController };
    }
    db: any;
    context: INamespace;
    options: IAPIOptions;
}

export interface IWorkerMetadata {

}

export interface IAPI {
    start(): Promise<boolean>;
    registerMiddleware(handler: IMiddlewareInput): Express;
}

export interface IWorker {
    start(): Promise<boolean>;
}


export interface IExtendAPI {
    apiServer: IAPI;
}

export interface IRoute<T, K> {
    bodyType?: { new(...arg: any[]): T },
    queryType?: { new(...arg: any[]): K},
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "PATCH";
    middlewares: {
        [key: string]: RequestHandler | RequestHandlerParams;
    };
    byPasses: string[];
}
export interface IControllerMetadata {
    name: string;
    routeBase: string;
    routes: {
        [key: string]: IRoute<any, any>;
    };
    middlewares: {
        [key: string]: RequestHandler | RequestHandlerParams;
    };
    byPasses: string[];
}

export interface IControllerProperty {
    uowConfig: {
        serviceIdentifier: string;
        classIdentifer: { new(): any };
    };
}

export interface IController extends IBaseClass<IControllerProperty> {
    subApp: Express;
}

export interface IMiddlewareChainable {
    toMiddleware(): (req: Request, res: Response, next: NextFunction) => void
}

export interface IMiddlewareInput {
    [key: string]: RequestHandler | RequestHandlerParams
}