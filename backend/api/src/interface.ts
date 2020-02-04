import { RequestHandler, RequestHandlerParams, Express } from "express-serve-static-core";
import { Request, Response, NextFunction } from "express";
import http from "http";
import { OpenAPIV3 } from "openapi-types";
export interface IAPIDocumentSection {
    openapi: "3.0.0";
    info: OpenAPIV3.InfoObject;
    servers: OpenAPIV3.ServerObject[];
}

export interface IControllerDocumentSection {
    tag: OpenAPIV3.TagObject;
    components: OpenAPIV3.ComponentsObject;
}

export interface IRouteDocumentSection {
    name: string;
    path: OpenAPIV3.PathItemObject
}

export interface IAPIOptions {
    port: number;
    documentSection?: IAPIDocumentSection;
}

export interface IAPIMetadata {
    classes: {
        [key in string]: { new(): IZone };
    }
    options: IAPIOptions
}

export interface IWorkerMetadata {

}

export interface IAPI {
    start(): Promise<boolean>;
    registerMiddleware(handler: IMiddlewareInput): Express;
    attach(path: string, expressInstance: Express): void;
    readonly httpServer: http.Server;
}

export interface IZone {
    establish(): Express;
    registerMiddleware(handler: IMiddlewareInput): Express;
}

export interface IAPIZoneMetadata {
    classes: {
        [key in string]: { new(): IController };
    }
    context: INamespace;
}


export interface IWorker {
    start(): Promise<boolean>;
}

export interface IRoute<T, K, L> {
    bodyType?: { new(...arg: any[]): T },
    queryType?: { new(...arg: any[]): K },
    paramType?: { new(...arg: any[]): L },
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "PATCH";
    middlewares: {
        [key: string]: RequestHandler | RequestHandlerParams;
    };
    byPasses: string[];
}

export interface IRouteMetadata<T, K, L> {
    list: IRoute<T, K, L>[];
    listMapping: {
        [key in string]: number
    };
    currentIndex: number;
}

export interface IControllerMetadata {
    name: string;
    routeBase: string;
    routes: {
        [key: string]: IRouteMetadata<any, any, any>;
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

export interface IQueryParamInput {
    pageSize?: number;
    pageIndex?: number;
    sort?: any;
    filter?: any;
    fields?: string;
}