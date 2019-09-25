import { LOGGER_SERVICE } from "@base/logger";
import { ILogger } from "@base/logger"
import { Injectable, getDependency } from "@base/class";
import { SERVER_API_KEY, SERVER_WORKER_KEY, SERVER_ZONE_KEY } from "@app/shared/constant";
import { IAPIOptions, IAPI, IAPIMetadata, IWorkerMetadata, IWorker, IMiddlewareInput, IZone, IAPIZoneMetadata } from "@app/interface";
import express, { Express, Request, Response, NextFunction } from "express";
import { Namespace } from "@base/class/utilities/namespace";
import { getController } from "@app/main/controller";
import { RequestHandler } from "express-serve-static-core";
import { LogMiddleware } from "@app/main/middleware";
import SwaggerUi from "swagger-ui-express";

function checkByPass(byPassPaths: string[], middleware: (req: Request, res: Response, next: NextFunction) => any) {
    if (!byPassPaths) byPassPaths = [];
    return (req: Request, res: Response, next: NextFunction) => {
        let checked = false;
        byPassPaths.map(byPassPath => {
            if (req.path.indexOf(byPassPath) === 0) {
                checked = true;
            }
        });
        if (!checked) {
            return middleware(req, res, next);
        }
        else {
            return next();
        }
    }
}

export namespace Server {
    export function APIZone() {
        return function (target: Object) {
            let apiMetadata = Server.getAPIZoneMetadata(target);
            if (!apiMetadata) {
                apiMetadata = {
                    classes: {},
                    context: null
                }
            }
            defineMetadata(SERVER_ZONE_KEY, apiMetadata, getClass(target));
        }
    }

    export const ZONE_SERVICE = "IZONE";
    @Injectable(ZONE_SERVICE, true, true)
    export class BaseAPIZone implements IZone {
        private zoneRoot: Express;
        establish(): Express {
            let apiZoneMetadata = getAPIZoneMetadata(this);
            if (!apiZoneMetadata.context) {
                apiZoneMetadata.context = Namespace.create("APIContext[" + getClass(this).name + "]");
            }
            Object.values(apiZoneMetadata.classes).map(controllerClass => {
                let classImp = controllerClass;
                let controller = new classImp();
                let controllerProperty = getController(classImp);
                let byPasses = {};
                if (controllerProperty) {
                    let middlewares = controllerProperty.middlewares;
                    Object.values(controllerProperty.routes).map(route => {
                        if (route) {
                            Object.values(route.list).map((r) => {
                                Object.values(r.byPasses).map(middlewareName => {
                                    if (!byPasses[middlewareName]) {
                                        byPasses[middlewareName] = [];
                                    }
                                    if (middlewares[middlewareName]) {
                                        byPasses[middlewareName].push(r.url);
                                    }
                                });
                            });
                        }
                    });
                    let middlewareKeys = Object.keys(middlewares);
                    Object.values(middlewares).map((middleware, index) => {
                        this.zoneRoot.use(controllerProperty.routeBase, checkByPass(byPasses[middlewareKeys[index]], middleware as RequestHandler));
                    });
                    this.zoneRoot.use(controllerProperty.routeBase, controller.subApp);
                    Object.values(controllerProperty.routes).map(route => {
                        if (route) {
                            Object.values(route.list).map((r) => {
                                Object.values(r.middlewares).map(middleware => {
                                    this.zoneRoot.use([controllerProperty.routeBase, r.url].join(""), middleware);
                                });
                            });
                        }
                    });
                }
            });
            return this.zoneRoot;
        }
        registerMiddleware(handler: IMiddlewareInput): Express {
            let apiMetadata = getAPIZoneMetadata(this);
            let byPasses = {};
            Object.values(apiMetadata.classes).map(controllerClass => {
                let classImp = controllerClass;
                let controllerProperty = getController(classImp);
                if (controllerProperty) {
                    controllerProperty.byPasses.map(middlewareName => {
                        if (!byPasses[middlewareName])
                            byPasses[middlewareName] = [];
                        if (handler[middlewareName]) {
                            if (byPasses[middlewareName].indexOf(controllerProperty.routeBase) < 0) {
                                byPasses[middlewareName].push(controllerProperty.routeBase);
                            }
                        }
                    });
                    Object.values(controllerProperty.routes).map((route) => {
                        if (route) {
                            Object.values(route.list).map((r) => {
                                r.byPasses.map(middlewareName => {
                                    if (!byPasses[middlewareName]) {
                                        byPasses[middlewareName] = [];
                                    }
                                    if (handler[middlewareName]) {
                                        if (byPasses[middlewareName].indexOf(controllerProperty.routeBase) < 0) {
                                            byPasses[middlewareName].push([controllerProperty.routeBase, r.url].join(""));
                                        }
                                    }
                                });
                            });
                        }
                    });
                }
            });
            let handlerKeys = Object.keys(handler);
            let newServerRoot = this.zoneRoot;
            Object.values(handler).map((h, index) => {
                newServerRoot = this.zoneRoot.use(checkByPass(byPasses[handlerKeys[index]], h as RequestHandler));
            })
            return newServerRoot;
        }
        constructor() {
            this.zoneRoot = express();
        }
    }

    export function APIManager(options: IAPIOptions) {
        return (target: any) => {
            let apiMetadata: IAPIMetadata = getAPIMetadata(target);
            if (!apiMetadata) {
                apiMetadata = {
                    classes: {},
                    options: null
                }
            }
            apiMetadata.options = options;
            defineMetadata(SERVER_API_KEY, apiMetadata, getClass(target));
        }
    }

    export const API_SERVICE = "IAPI";
    @Injectable(API_SERVICE, true, true)
    export class API implements IAPI {
        private serverRoot: Express;
        private processListener: NodeJS.MessageListener;
        private processId = "api-server";
        protected logger: ILogger;
        private swaggerDocument = {
            swagger: "2.0",
            info: {
                description: "This is a sample server Petstore server. You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/). For this sample, you can use the api key `special-key` to test the authorization filters.",
                title: "This is just an api"
            },
            basePath: "/api",
            tags: [
                {
                    name: "provider",
                    description: "about provider"
                }
            ],
            schemes: [
                "http",
                "https"
            ],
            paths: {
                "/provider/create": {
                    post: {
                        tags: ["provider"],
                        summary: "Create new provider",
                        description: "Create new provider. It's mean register a new provider",
                        operationId: "createProvider",
                        consumes: [
                            "application/json"
                        ],
                        produces: [
                            "application/json"
                        ],
                        parameters: [
                            {
                                in: "body",
                                name: "body",
                                description: "Pet object that needs to be added to the store",
                                required: true,
                                schema: {
                                    $ref: "#/definitions/Pet"
                                }
                            }
                        ],
                        responses: {
                            405: {
                                description: "Invalid input"
                            }
                        }
                    }
                }
            },
            definitions: {
                Pet: {
                    type: "object",
                    required: [
                        "name",
                        "photoUrls"
                    ],
                    properties: {
                        id: {
                            type: "integer",
                            format: "int64"
                        },
                        category: {
                            $ref: "#/definitions/Category"
                        },
                        name: {
                            type: "string",
                            example: "doggie"
                        },
                        photoUrls: {
                            type: "array",
                            xml: {
                                name: "photoUrl",
                                wrapped: true
                            },
                            items: {
                                type: "string"
                            }
                        },
                        tags: {
                            type: "array",
                            xml: {
                                name: "tag",
                                wrapped: true
                            },
                            items: {
                                $ref: "#/definitions/Tag"
                            }
                        },
                        status: {
                            type: "string",
                            description: "pet status in the store",
                            enum: [
                                "available",
                                "pending",
                                "sold"
                            ]
                        }
                    },
                    xml: {
                        name: "Pet"
                    }
                }
            }
        };
        start(): Promise<boolean> {
            let apiMetadata = getAPIMetadata(this);
            let logMiddleware = new LogMiddleware();
            this.registerMiddleware({ apiLog: logMiddleware.toMiddleware() });
            let zoneKeys = Object.keys(apiMetadata.classes);
            zoneKeys = zoneKeys.map(zoneKey => {
                let zoneKeyUpperCases = zoneKey.match(/([A-Z])/g) || [];
                zoneKeyUpperCases.map(zoneKeyUpperCase => {
                    if (zoneKey.indexOf(zoneKeyUpperCase) === 0) zoneKey = zoneKey.replace(zoneKeyUpperCase, zoneKeyUpperCase.toLowerCase());
                    else zoneKey = zoneKey.replace(zoneKeyUpperCase, "-" + zoneKeyUpperCase.toLowerCase());
                })
                return zoneKey.indexOf("/") === 0 ? zoneKey : "/" + zoneKey;
            });
            Object.values(apiMetadata.classes).map((zoneClass, index) => {
                let zone = getDependency<IZone>(ZONE_SERVICE, zoneClass.name);
                this.serverRoot.use(zoneKeys[index], zone.establish());
            });
            return new Promise((resolve, reject) => {
                this.serverRoot.use("/documents", SwaggerUi.serve, SwaggerUi.setup(this.swaggerDocument));
                const server = this.serverRoot.listen(apiMetadata.options.port, () => {
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
                    });
                    if(!this.processListener){
                        this.processListener = (message, sendHandle) => {
                            if(message && message.event === "STOP"){
                                server.close((err) => {
                                    if(err) {
                                        this.logger.pushError(err, "api");
                                    }
                                    else {
                                        this.logger.pushInfo("Disconnect to server", "api");
                                    }
                                    process.watcher.emit("STOP", this.processId);
                                });
                            }
                        }
                        process.on("message", this.processListener);
                    }
                    resolve(true);
                }).once("error", (err) => {
                    reject(err);
                });
            });
        }
        registerMiddleware(handler: IMiddlewareInput): Express {
            let apiMetadata = getAPIMetadata(this);
            let byPasses = {};
            Object.values(apiMetadata.classes).map(zoneClass => {
                let apiZoneMetadata = getAPIZoneMetadata(zoneClass);
                Object.values(apiZoneMetadata.classes).map(controllerClass => {
                    let classImp = controllerClass;
                    let controllerProperty = getController(classImp);
                    if (controllerProperty) {
                        controllerProperty.byPasses.map(middlewareName => {
                            if (!byPasses[middlewareName])
                                byPasses[middlewareName] = [];
                            if (handler[middlewareName]) {
                                if (byPasses[middlewareName].indexOf(controllerProperty.routeBase) < 0) {
                                    byPasses[middlewareName].push(controllerProperty.routeBase);
                                }
                            }
                        });
                        Object.values(controllerProperty.routes).map((route) => {
                            if (route) {
                                Object.values(route.list).map((r) => {
                                    r.byPasses.map(middlewareName => {
                                        if (!byPasses[middlewareName]) {
                                            byPasses[middlewareName] = [];
                                        }
                                        if (handler[middlewareName]) {
                                            if (byPasses[middlewareName].indexOf(controllerProperty.routeBase) < 0) {
                                                byPasses[middlewareName].push([controllerProperty.routeBase, r.url].join(""));
                                            }
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            });
            let handlerKeys = Object.keys(handler);
            let newServerRoot = this.serverRoot;
            Object.values(handler).map((h, index) => {
                newServerRoot = this.serverRoot.use(checkByPass(byPasses[handlerKeys[index]], h as RequestHandler));
            })
            this.serverRoot = newServerRoot;
            return this.serverRoot;
        }
        constructor() {
            this.serverRoot = express();
            this.logger = getDependency<ILogger>(LOGGER_SERVICE);
            process.watcher.joinFrom(this.processId);
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
    export function getAPIZoneMetadata(target: any): IAPIZoneMetadata {
        let classImp = getClass(target);
        let apiZoneMetadata: IAPIZoneMetadata = getMetadata(SERVER_ZONE_KEY, classImp);
        return apiZoneMetadata;
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