import { App, UnitOfWork } from "@base/interfaces";
import { IExtendApi } from "./internal";
import express, { RequestHandler } from "express";
import { urlencoded, json } from "body-parser";
import { v1 } from "uuid";
import { getController, IController } from "./main/controller";
import { PathParams, RequestHandlerParams } from "express-serve-static-core";
import { IExtendLogger } from "@base/logger";

declare const app: App & IExtendApi;

app.server = express();

export * from "./main/controller";

app.startServer =  function (this: (App & IExtendApi & IExtendLogger), port: number, unitOfWorkInstance: UnitOfWork, controllers: {[key: string]: { new(unitOfWorkInstance: UnitOfWork) : IController} }) : Promise<boolean> {
    let namespace = app.context.create("dbContext");
    app.server.use(json({}));
    app.server.use(urlencoded({ extended: true }));
    app.server.use((req, res, next) => {
        namespace.run(async () => {
            namespace.set("tid", v1());
            next();
        }).catch((e) => {
            this.logger.pushLog({
                level: "error",
                message: {
                    delimiter: "",
                    tag: "API",
                    messages: [
                        {
                            text: e.stack
                        }
                    ]
                }
            });
        });

        res.once("finish", () => {
            namespace.dispose();
        });
    });
    Object.keys(controllers).map(controllerKey => {
        let classImp = controllers[controllerKey];
        let controller = new classImp(unitOfWorkInstance);
        let controllerProperty = getController(classImp);
        app.server.use(controllerProperty.routeBase, controller.subApp);
    });
    return new Promise((resolve, reject) => {
        app.server.listen(port, () => {
            if(this.logger){
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
                                ------------------- Server started at port ${port} ---------------------
                                ---------------------------------------------------------------------
                                ---------------------------------------------------------------------
                                `
                            }
                        ]
                    }
                })
            }
            resolve(true);
        })
        .once("error", (err) => {
            reject(err);
        });
    });
}

app.setLogForApi = function(this: App & IExtendApi & IExtendLogger, hasLog: boolean = false){
    if(hasLog){
        if(this.logger){
            this.registerMiddleware([(req, res, next) => {
                this.logger.pushLog({
                    level: "info",
                    message: {
                        delimiter: " ",
                        tag: "API",
                        messages: [
                            {
                                text: (req.headers["x-forwarded-for"]? req.headers["x-forwarded-for"].toString() : null) || req.connection.remoteAddress,
                                style: {
                                    fontColor: {r: 216, g: 27, b: 96}
                                }
                            },
                            {
                                text: req.method,
                                style: {
                                    fontColor: {r: 76, g: 175, b: 80}
                                }
                            },
                            {
                                text: req.url + " HTTP/" + req.httpVersion
                            },
                            {
                                text: res.statusCode.toString(),
                                style: {
                                    fontColor: {r: 255, g: 61, b: 0}
                                }
                            },
                            {
                                text: req.headers["user-agent"],
                            }
                        ]
                    }
                });
                next();
            }]);
        }
    }
}

app.registerMiddleware = function(arg0: (RequestHandler[] | RequestHandlerParams[] | PathParams), arg1?: (RequestHandler[] | RequestHandlerParams[])){
    if(arg0 instanceof Array){
        return this.server.use(arg0 as RequestHandler[]);
    }
    else{
        return this.server.use(arg0 as PathParams, arg1 as RequestHandler[]);
    }
}

app.useCORS = function(this: (App & IExtendApi & IExtendLogger)){
    return this.registerMiddleware([(req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-XSRF-TOKEN, Authorization");
        this.logger.pushLog({
            level: "info",
            message: {
                delimiter: "",
                tag: "API",
                messages: [
                    {
                        text: JSON.stringify(req.headers)
                    }
                ]
            }
        })
        if(req.method === 'OPTIONS'){
            res.status(204).send();
        }
        else{
            next();
        }
    }]);
}

export * from "./internal";

// registerController(controllers){
//     if(this.type === "WebAPI"){
//         if(!this.route){
//             this.route = {
//                 base: null,
//                 controllers: {}
//             }
//         }
//         Object.keys(controllers).map(controllerKey => {
//             this.route.controllers[controllerKey] = controllers[controllerKey];
//         });
//     }
// }
// start(unitOfWork: UnitOfWorkAbs) {
//     let namespace = Namespace.create("dbContext");
//     if (this.type === "WebAPI") {
//         if(!this.route){
//             this.route = {
//                 base: express(),
//                 controllers: {}
//             }
//         }
//         if(!this.route.base){
//             this.route.base = express();
//         }
//         this.route.base.use(json({}));
//         this.route.base.use(urlencoded({extended: true}));
//         this.route.base.use(morgan("combined"))
//         this.route.base.use((req, res, next) => {
//             namespace.run(async () => {
//                 namespace.set("tid", uuidv1());
//                 next();
//             });
//             res.once("finish", () => {
//                 namespace.dispose();
//             });
//         });
//         Object.keys(this.route.controllers).map(controllerKey => {
//             let classImp = this.route.controllers[controllerKey];
//             let controller = new classImp(unitOfWork);
//             let controllerProperty = getController(classImp);
//             this.route.base.use(controllerProperty.routeBase, controller.subApp);
//         });
//         this.route.base.listen(3000, () => {
//             console.log(`
//             ---------------------------------------------------------------------
//             ---------------------------------------------------------------------
//             --------------------- Server start at port 3000 ---------------------
//             ---------------------------------------------------------------------
//             ---------------------------------------------------------------------
//             `);
//         });
//     }
//     else {

//     }
// }