import express from "express";
import { CONTROLLER_KEY } from "../../shared/constant";
import { Property, getProperties, Injectable, getDependency, mapData } from "@base/class";
import { IController, IControllerMetadata, IRoute, IMiddlewareInput, IControllerProperty } from "../../interface";
import { IncomingHttpHeaders } from "http";
import { Stream } from "stream";
import { ILogger, LOGGER_SERVICE } from "@base/logger";
import { ResponseBody } from "../response";
import { ResponseTemplate as Resp } from "../../main/response";

export const CONTROLLER_SERVICE = "IController";

@Injectable(CONTROLLER_SERVICE, true, true)
export class ControllerImp implements IController {
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    initValue(input: Partial<IControllerProperty>): void {
        if (input) {
            let uowConfig = input.uowConfig;
            if (uowConfig) {
                this.uowInstance = getDependency<typeof uowConfig.classIdentifer>(uowConfig.serviceIdentifier);
            }
        }
    }
    subApp: express.Express;
    protected uowInstance: any;
    protected logger: ILogger;
    constructor() {
        this.subApp = express();
        this.logger = getDependency<ILogger>(LOGGER_SERVICE);
        this.register();
    }
    private register() {
        let controllerProperty: IControllerMetadata = getMetadata(CONTROLLER_KEY, getClass(this));
        let properties = getProperties(getClass(this));
        properties.map(property => {
            let routeConfig = controllerProperty.routes[property.name];
            let handlers = [];
            Object.values(routeConfig.middlewares).map(middleware => {
                handlers.push(middleware);
            });
            handlers.push((req: express.Request, res: express.Response) => {
                try{
                    let input = checkInput<typeof routeConfig.bodyType, typeof routeConfig.queryType>(routeConfig.bodyType, routeConfig.queryType, req);
                    let result = this[property.name](input);
                    if (result instanceof Stream) {
                        result.pipe(res);
                        res.once("drain", () => {
                            console.log("It's was drain");
                        });
                    }
                    else if (typeof result.then === "function" && typeof result.catch === "function") {
                        result.then((value: ResponseBody) => {
                            let body = Object.assign({}, value);
                            delete body.code;
                            res.status(value.code).json(body);
                        }).catch(err => {
                            let error = Resp.error(500, err.message);
                            res.status(500).json({ 
                                status: error.status,
                                message: error.message,
                                error: error.error || undefined
                            });
                        });
                    }
                    else {
                        res.send(result);
                    }
                }
                catch(e){
                    let error = Resp.error(400, e.message);
                    res.status(400).json({
                        status: error.status,
                        message: error.message,
                        error: error.error || undefined
                    })
                }
            });
            this.subApp[routeConfig.method.toLowerCase()](routeConfig.url, handlers);
        });
    }
}

export function Controller(routeBase: string) {
    return function (target: any) {
        let classImp = getClass(target);
        let controllerProperty: IControllerMetadata = getController(target);
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {},
                middlewares: {},
                byPasses: []
            };
        }
        if (routeBase.indexOf("/") !== 0) {
            routeBase = "/" + routeBase;
        }
        controllerProperty.name = classImp.name;
        controllerProperty.routeBase = routeBase;
        defineMetadata(CONTROLLER_KEY, controllerProperty, target.constructor);
    }
}

export function Route<T, K>(routeConfig: Omit<IRoute<T, K>, "middlewares" | "byPasses">) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Property(Object)(target, propertyKey);
        let controllerProperty: IControllerMetadata = getController(target);
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {},
                middlewares: {},
                byPasses: []
            };
        }
        let route: IRoute<T, K> = {
            byPasses: [],
            middlewares: {},
            ...routeConfig
        }
        if (route.url.indexOf("/") !== 0) {
            route.url = "/" + route.url;
        }
        if (controllerProperty.routes[propertyKey]) {
            if (controllerProperty.routes[propertyKey].byPasses) route.byPasses = controllerProperty.routes[propertyKey].byPasses;
            if (controllerProperty.routes[propertyKey].middlewares) route.middlewares = controllerProperty.routes[propertyKey].middlewares;
        }
        controllerProperty.routes[propertyKey] = route;
        defineMetadata(CONTROLLER_KEY, controllerProperty, target.constructor);
    }
}

export function getController(target: any): IControllerMetadata {
    let classImp = getClass(target);
    let controllerProperty: IControllerMetadata = getMetadata(CONTROLLER_KEY, classImp);
    return controllerProperty;
}

export interface IRequestParam<T, K> {
    query: K;
    params: {
        [key in string]: any
    };
    body: T,
    headers: IncomingHttpHeaders
}



function checkInput<T, K>(bodyClass: { new(): T }, queryClass: { new() : K }, req: express.Request) {
    try{
        let input: IRequestParam<T, K> = {
            query: {} as K,
            params: req.params,
            body: {} as T,
            headers: req.headers
        }
        if(bodyClass){
            let body = mapData(bodyClass, req.body || {});
            input.body = body;
        }
        if(queryClass){
            let query = mapData(queryClass, req.query || {});
            input.query = query;
        }
        return input;
    }
    catch(e){
        throw e;
    }
}

export function Middleware(handlers: IMiddlewareInput): (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any {
    return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
        let numArguments = arguments.length;
        let controllerProperty = getController(target);
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {},
                middlewares: {},
                byPasses: []
            };
        }
        if (numArguments === 1) {
            controllerProperty.middlewares = handlers;
        }
        else if (numArguments === 3) {
            if (!controllerProperty.routes[propertyKey]) {
                controllerProperty.routes[propertyKey] = {                  
                    byPasses: [],
                    method: null,
                    middlewares: {},
                    name: null,
                    url: null,
                }
            }
            controllerProperty.routes[propertyKey].middlewares = handlers;
        }
        defineMetadata(CONTROLLER_KEY, controllerProperty, target);
    }
}

export function Bypass(middlewareName: string, ...moreMidllewareName: string[]): (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any {
    return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
        let numArguments = arguments.length;
        let controllerProperty = getController(target);
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {},
                middlewares: {},
                byPasses: []
            };
        }
        if (numArguments === 1) {
            moreMidllewareName.unshift(middlewareName);
            controllerProperty.byPasses = moreMidllewareName;
            controllerProperty.routes[propertyKey].byPasses = moreMidllewareName;
        }
        else if (numArguments === 3) {
            if (!controllerProperty.routes[propertyKey]) {
                controllerProperty.routes[propertyKey] = {
                    byPasses: [],
                    method: null,
                    middlewares: {},
                    name: null,
                    url: null
                }
            }
            moreMidllewareName.unshift(middlewareName);
            controllerProperty.routes[propertyKey].byPasses = moreMidllewareName;
        }
        defineMetadata(CONTROLLER_KEY, controllerProperty, target);
    }
}