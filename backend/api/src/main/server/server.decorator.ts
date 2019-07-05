import { LOGGER_SERVICE } from "@base/logger";
import { ILogger } from "@base/logger"
import { Injectable, getDependency } from "@base/class";
import { SERVER_API_KEY, SERVER_WORKER_KEY } from "../../shared/constant";
import { IAPIOptions, IAPI, IAPIMetadata, IWorkerMetadata, IWorker, IMiddlewareInput } from "../../interface";
import express, { Express, Request, Response, NextFunction } from "express";
import { Namespace } from "@base/class/utilities/namespace";
import { getController } from "../controller";
import { RequestHandler } from "express-serve-static-core";
import { LogMiddleware } from "../middleware";

function checkByPass(byPassPaths: string[], middleware: (req: Request, res: Response, next: NextFunction) => any){
    if(!byPassPaths) byPassPaths = [];
    return (req: Request, res: Response, next: NextFunction) => {
        let checked = false;
        byPassPaths.map(byPassPath => {
            if(req.path.indexOf(byPassPath) === 0){
                checked = true;
            }
        });
        if(!checked){
            return middleware(req, res, next);
        }
        else{
            return next();
        }
    }
}

export namespace Server {
    export function DAPI(db: any, options: IAPIOptions) {
        return function (target: Object) {
            let apiMetadata = Server.getAPIMetadata(target);
            if (!apiMetadata) {
                apiMetadata = {
                    classes: {},
                    db: null,
                    context: null,
                    options: null
                }
            }
            apiMetadata.db = db;
            apiMetadata.options = options;
            defineMetadata(SERVER_API_KEY, apiMetadata, getClass(target));
        }
    }
    export const API_SERVICE = "IAPI";
    @Injectable(API_SERVICE, true, true)
    export class API implements IAPI {
        private serverRoot: Express;
        protected logger: ILogger;
        start(): Promise<boolean> {
            let apiMetadata = getAPIMetadata(this);
            if (!apiMetadata.context) {
                apiMetadata.context = Namespace.create("api-context");
            }
            let logMiddleware = new LogMiddleware();
            this.registerMiddleware({ apiLog: logMiddleware.toMiddleware()});
            Object.values(apiMetadata.classes).map(controllerClass => {
                let classImp = controllerClass;
                let controller = new classImp();
                let controllerProperty = getController(classImp);
                let byPasses = {};
                let middlewares = controllerProperty.middlewares;
                Object.values(controllerProperty.routes).map(route => {
                    Object.values(route.byPasses).map(middlewareName => {
                        if(!byPasses[middlewareName]){
                            byPasses[middlewareName] = [];
                        }
                        if(middlewares[middlewareName]){
                            byPasses[middlewareName].push(route.url);
                        }
                    });
                });
                let middlewareKeys = Object.keys(middlewares);
                Object.values(middlewares).map((middleware, index) => {
                    this.serverRoot.use(controllerProperty.routeBase, checkByPass(byPasses[middlewareKeys[index]], middleware as RequestHandler));
                });
                this.serverRoot.use(controllerProperty.routeBase, controller.subApp);
                Object.values(controllerProperty.routes).map(route => {
                    Object.values(route.middlewares).map(middleware => {
                        this.serverRoot.use([controllerProperty.routeBase, route.url].join(""), middleware);
                    });
                });
            });
            return new Promise((resolve, reject) => {
                this.serverRoot.listen(apiMetadata.options.port, () => {
                    this.logger.pushLog({
                        level: "info",
                        message: {
                            delimiter: " ",
                            tag: "API",
                            messages: [
                                {
                                    text: `
                                    ---------------------------------------------------------------------
                                    ---------------------------------------------------------------------
                                    ------------------- Server started at port ${apiMetadata.options.port} ---------------------
                                    ---------------------------------------------------------------------
                                    ---------------------------------------------------------------------
                                    `
                                }
                            ]
                        }
                    })
                    resolve(true);
                })
                    .once("error", (err) => {
                        reject(err);
                    });
            });
        }
        registerMiddleware(handler: IMiddlewareInput): Express {
            let apiMetadata = getAPIMetadata(this);
            let byPasses = {};
            Object.values(apiMetadata.classes).map(controllerClass => {
                let classImp = controllerClass;
                let controllerProperty = getController(classImp);
                controllerProperty.byPasses.map(middlewareName => {
                    if(!byPasses[middlewareName])
                        byPasses[middlewareName] = [];
                    if(handler[middlewareName]){
                        if(byPasses[middlewareName].indexOf(controllerProperty.routeBase) < 0){
                            byPasses[middlewareName].push(controllerProperty.routeBase);
                        }
                    }
                });
                Object.values(controllerProperty.routes).map((route) => {
                    route.byPasses.map(middlewareName => {
                        if(!byPasses[middlewareName]){
                            byPasses[middlewareName] = [];
                        }
                        if(handler[middlewareName]){
                            if(byPasses[middlewareName].indexOf(controllerProperty.routeBase) < 0){
                                byPasses[middlewareName].push([controllerProperty.routeBase, route.url].join(""));
                            }
                        }
                    });
                });
            });
            let handlerKeys = Object.keys(handler);
            let newServerRoot = this.serverRoot;
            Object.values(handler).map((h, index) => {
                newServerRoot = this.serverRoot.use(checkByPass(byPasses[handlerKeys[index]], h as RequestHandler));
            })
            return newServerRoot;
        }
        constructor() {
            this.serverRoot = express();
            this.logger = getDependency<ILogger>(LOGGER_SERVICE);
        }
    }
    export function DWorker() {
        return function (target: Object) {
            let workerMetadata = Server.getWorkerMetadata(target);
            if (!workerMetadata) {
                workerMetadata = {}
            }
        }
    }
    export const WORKER_SERVICE = "IWorker";

    @Injectable(WORKER_SERVICE, true, true)
    export class Worker implements IWorker {
        protected logger: ILogger;
        start(): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        constructor() {
            this.logger = getDependency<ILogger>(LOGGER_SERVICE);
        }
    }
    export function getAPIMetadata(target: any): IAPIMetadata {
        let classImp = getClass(target);
        let apiMetadata: IAPIMetadata = getMetadata(SERVER_API_KEY, classImp);
        return apiMetadata;
    }
    export function getWorkerMetadata(target: any): IWorkerMetadata {
        let classImp = getClass(target);
        let workerMetadata: IAPIMetadata = getMetadata(SERVER_WORKER_KEY, classImp);
        return workerMetadata;
    }
}