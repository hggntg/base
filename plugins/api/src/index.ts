import express, { RequestHandler } from "express";
import { IController } from "./main/controller";
import { UnitOfWork } from "@base/interfaces";
import { ApplicationRequestHandler, RequestHandlerParams, PathParams } from "express-serve-static-core";

export interface IExtendApi{
    server?: express.Express;
    setLogForApi?(hasLog: boolean);
    startServer?(port: number, unitOfWorkInstance: UnitOfWork, controllers: {[key: string]: { new(unitOfWorkInstance: UnitOfWork) : IController} }): Promise<boolean>;
    setResponseTemplate?();
    useCORS?();
    registerMiddleware?(handlers: RequestHandler[]): express.Express;
    registerMiddleware?(path: PathParams,handlers: RequestHandler[]): express.Express;
    registerMiddleware?(handlers: RequestHandlerParams[]): express.Express;
    registerMiddleware?(path: PathParams,handlers: RequestHandlerParams[]): express.Express;
    registerMiddleware?(arg0: (RequestHandler[] | RequestHandlerParams[] | PathParams), arg1?: (RequestHandler[] | RequestHandlerParams[])): express.Express;
}