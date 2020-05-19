import express, { Response, response } from "express";
import { CONTROLLER_KEY } from "@app/shared/constant";
import { IController, IControllerMetadata, IRoute, IMiddlewareInput, IControllerProperty, IRouteDocumentSection, IControllerDocumentSection } from "@app/interface";
import { IncomingHttpHeaders } from "http";
import { Stream, Readable } from "stream";
import { ResponseBody } from "@app/main/response";
import { ResponseTemplate as Resp } from "@app/main/response";
import { OpenAPIV3 } from "openapi-types";
import { setAPIDocumentMetadata } from "@app/main/server/document";

export const CONTROLLER_SERVICE = "IController";

interface IAppendHttpHeader {
    code: number;
    headers: { [key in string]: string }
}

interface IControllerContext {
    req: express.Request,
    res: express.Response
}

function generateRouteExecution(this: IController, property) {
    return async (req: express.Request, res: express.Response) => {
        let controllerProperty = getController(this);
        let index = controllerProperty.routes[property.name].listMapping[req.route.path];
        let currentRoute = controllerProperty.routes[property.name].list[index];
        try {
            let input = checkInput<typeof currentRoute.bodyType, typeof currentRoute.queryType, typeof currentRoute.paramType>(currentRoute.bodyType, currentRoute.queryType, currentRoute.paramType, {req: req, res: res});
            let responseResult = this[property.name](input);
            if(responseResult){
                if (typeof (<any>responseResult).pipe === "function") {
                    let result = responseResult as Readable;
                    result.once("response-error", (err: IBaseError) => {
                        let error = Resp.error(err);
                        if(!res.headersSent){
                            res.status(error.code).json({
                                code: error.code,
                                status: error.status,
                                message: error.message,
                                error: error.error || undefined
                            });
                        }
                    }).on("append-http-header", (httpHeader: IAppendHttpHeader) => {
                        if(!res.headersSent){
                            if(httpHeader.code) res.status(httpHeader.code);
                            if(httpHeader.headers) {
                                let headerKeys = Object.keys(httpHeader.headers);
                                Object.values((httpHeader.headers)).map((header, index) => {
                                    let headerKey = headerKeys[index];
                                    res.setHeader(headerKey, header);
                                });
                            }
                        }
                    }).pipe(res);
                    res.once("drain", () => {
                        console.log("It's was drain");
                    }).on("error", (err: IBaseError) => {
                        let error = Resp.error(err);
                        if(!res.headersSent){
                            res.status(error.code).json({
                                code: error.code,
                                status: error.status,
                                message: error.message,
                                error: error.error || undefined
                            });
                        }
                    });
                }
                else if(typeof responseResult.then === "function" && typeof responseResult.catch === "function") {
                    try {
                        let result = responseResult;
                        return await result.then((responseValue: ResponseBody | Readable | Stream) => {
                            if(responseValue){
                                if (typeof (<any>responseValue).pipe === "function") {
                                    let value = responseValue as Readable;
                                    value.once("response-error", (err: IBaseError) => {
                                        let error = Resp.error(err);
                                        if(!res.headersSent){
                                            res.status(error.code).json({
                                                code: error.code,
                                                status: error.status,
                                                message: error.message,
                                                error: error.error || undefined
                                            });
                                        }
                                    }).on("append-http-header", (httpHeader: IAppendHttpHeader) => {
                                        if(!res.headersSent){
                                            if(httpHeader.code) res.status(httpHeader.code);
                                            if(httpHeader.headers) {
                                                let headerKeys = Object.keys(httpHeader.headers);
                                                Object.values((httpHeader.headers)).map((header, index) => {
                                                    let headerKey = headerKeys[index];
                                                    res.setHeader(headerKey, header);
                                                });
                                            }
                                        }
                                    }).pipe(res);
                                    res.once("drain", () => {
                                        console.log("It's was drain");
                                    }).on("error", (err: IBaseError) => {
                                        let error = Resp.error(err);
                                        if(!res.headersSent){
                                            res.status(error.code).json({
                                                code: error.code,
                                                status: error.status,
                                                message: error.message,
                                                error: error.error || undefined
                                            });
                                        }
                                    });
                                }
                                else {
                                    let value = responseValue as ResponseBody;
                                    let body = Object.__base__clone<any>(value);
                                    res.status(value.code).json(body);
                                }
                            }
                            else {
                                res.status(200).send();
                            }
                        }).catch(err => {
                            throw err;
                        });
                    }
                    catch (e) {
                        let error = Resp.error(e);
                        if(!res.headersSent){
                            res.status(error.code).json({
                                code: error.code,
                                status: error.status,
                                message: error.message,
                                error: error.error || undefined
                            });
                        }
                    }
                }
                else {
                    if(!res.headersSent){
                        res.send(responseResult);
                    }
                }
            }
            else {
                if(!res.headersSent){
                    
                }
            }
        }
        catch (e) {
            let error = Resp.error(e);
            if(!res.headersSent){
                res.status(error.code).json({
                    code: error.code,
                    status: error.status,
                    message: error.message,
                    error: error.error || undefined
                });
            }
            else {
                console.error(error);
            }
        }
    }
}

@Injectable(CONTROLLER_SERVICE, true, true)
export class ControllerImp implements IController {
    init(input: Partial<IControllerProperty>): void {
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
        this.subApp.set("etag", false);
        this.logger = getDependency<ILogger>(LOGGER_SERVICE);
        this.register();
    }
    private register() {
        let controllerProperty: IControllerMetadata = getMetadata(CONTROLLER_KEY, getClass(this));
        let properties = getProperties(getClass(this));
        properties.map(property => {
            let routeConfig = controllerProperty.routes[property.name];
            let routeList = routeConfig.list;
            let handlers = [];
            let middlewares = {};
            routeList.map(route => {
                let middlewareKeys = Object.keys(route.middlewares);
                Object.values(route.middlewares).map((middleware, index) => {
                    middlewares[middlewareKeys[index]] = middleware;
                });
                Object.values(middlewares).map((middleware) => {
                    handlers.push(middleware);
                });

                let routeExecution = generateRouteExecution.apply(this, [property]);
                handlers.push(routeExecution);
                this.subApp[route.method.toLowerCase()](route.url, handlers);
            })
        });
    }
}

export function Controller(routeBase: string, documentSection?: IControllerDocumentSection) {
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
        if(documentSection){
            setAPIDocumentMetadata(documentSection);
        }
    }
}

export function Route<T = any, K = any, L = any>(routeConfig: Omit<IRoute<T, K, L>, "middlewares" | "byPasses">, documentSection?: IRouteDocumentSection) {
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
        let route: IRoute<T, K, L> = {
            byPasses: [],
            middlewares: {},
            ...routeConfig
        }
        if (route.url.indexOf("/") !== 0) {
            route.url = "/" + route.url;
        }
        if (!controllerProperty.routes[propertyKey]) controllerProperty.routes[propertyKey] = { list: [], listMapping: {}, currentIndex: -1 };
        if (!controllerProperty.routes[propertyKey].list) controllerProperty.routes[propertyKey].list = [];
        controllerProperty.routes[propertyKey].currentIndex += 1;
        let lastIndex = controllerProperty.routes[propertyKey].currentIndex;

        if (!controllerProperty.routes[propertyKey].list[lastIndex]) {
            controllerProperty.routes[propertyKey].list[lastIndex] = {
                byPasses: [],
                method: null,
                middlewares: {},
                name: null,
                url: null
            }
        }
        if (controllerProperty.routes[propertyKey].list[lastIndex].byPasses) route.byPasses = controllerProperty.routes[propertyKey].list[lastIndex].byPasses;
        if (controllerProperty.routes[propertyKey].list[lastIndex].middlewares) route.middlewares = controllerProperty.routes[propertyKey].list[lastIndex].middlewares;
        controllerProperty.routes[propertyKey].list[lastIndex] = route;
        controllerProperty.routes[propertyKey].listMapping[route.url] = lastIndex;
        defineMetadata(CONTROLLER_KEY, controllerProperty, target.constructor);
        if(documentSection){
            setAPIDocumentMetadata(documentSection);
        }
    }
}

export function getController(target: any): IControllerMetadata {
    let classImp = getClass(target);
    let controllerProperty: IControllerMetadata = getMetadata(CONTROLLER_KEY, classImp);
    return controllerProperty;
}

export interface IRequestParam<T = any, K = any, L = any> {
    query: K;
    params: L;
    body: T,
    headers: IncomingHttpHeaders,
    context: IControllerContext
}



function checkInput<T, K, L>(bodyClass: { new(): T }, queryClass: { new(): K }, paramClass: { new(): L }, context: IControllerContext) {
    try {
        let input: IRequestParam<T, K> = {
            query: {} as K,
            params: {},
            body: {} as T,
            headers: context.req.headers,
            context: context
        }
        if (bodyClass) {
            let body = mapData(bodyClass, context.req.body || {});
            if(body.error) throw body.error;
            input.body = body.value || {} as T;
        }
        if (queryClass) {
            let tempQuery = context.req.query || {};
            let tempQueryKeys = Object.keys(tempQuery);
            Object.values(tempQuery).map((v, index) => {
                if(!v){
                    let key = tempQueryKeys[index];
                    tempQuery[key] = true;
                }
            });
            let query = mapData(queryClass, tempQuery);
            if(query.error) throw query.error;
            input.query = query.value || {} as K;
        }
        if (paramClass) {
            let params = mapData(paramClass, context.req.params || {});
            if(params.error) throw params.error;
            input.params = params.value || {};
        }
        return input;
    }
    catch (e) {
        throw new BaseError(400, 400, e.message);
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
                    list: [],
                    listMapping: {},
                    currentIndex: -1
                }
            }
            let lastIndex = controllerProperty.routes[propertyKey].currentIndex;
            if (lastIndex === -1) lastIndex = 0;
            if (!controllerProperty.routes[propertyKey].list[lastIndex]) {
                controllerProperty.routes[propertyKey].list[lastIndex] = {
                    byPasses: [],
                    method: null,
                    middlewares: {},
                    name: null,
                    url: null
                }
            }
            controllerProperty.routes[propertyKey].list[lastIndex].middlewares = handlers;
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
            if (!controllerProperty.routes[propertyKey]) controllerProperty.routes[propertyKey] = { list: [], listMapping: {}, currentIndex: -1 };
            if (!controllerProperty.routes[propertyKey].list) controllerProperty.routes[propertyKey].list = [];
            let lastIndex = controllerProperty.routes[propertyKey].currentIndex;
            if (lastIndex === -1) lastIndex = 0;
            if (!controllerProperty.routes[propertyKey].list[lastIndex]) {
                controllerProperty.routes[propertyKey].list[lastIndex] = {
                    byPasses: [],
                    method: null,
                    middlewares: {},
                    name: null,
                    url: null
                }
            }
            if (lastIndex === 0) controllerProperty.routes[propertyKey].list[lastIndex].byPasses = moreMidllewareName;
            else {
                let byPasses = [];
                for (let i = 0; i < lastIndex; i++) {
                    let prevByPasses = controllerProperty.routes[propertyKey].list[i].byPasses;
                    prevByPasses.map(bypassName => {
                        if (!byPasses.includes(bypassName)) byPasses.push(bypassName);
                    });
                }
                moreMidllewareName.map(bypassName => {
                    if (!byPasses.includes(bypassName)) byPasses.push(bypassName);
                })
            }
        }
        else if (numArguments === 3) {
            if (!controllerProperty.routes[propertyKey]) controllerProperty.routes[propertyKey] = { list: [], listMapping: {}, currentIndex: -1 };
            if (!controllerProperty.routes[propertyKey].list) controllerProperty.routes[propertyKey].list = [];
            let lastIndex = controllerProperty.routes[propertyKey].currentIndex;
            if (lastIndex === -1) lastIndex = 0;
            if (!controllerProperty.routes[propertyKey].list[lastIndex]) {
                controllerProperty.routes[propertyKey].list[lastIndex] = {
                    byPasses: [],
                    method: null,
                    middlewares: {},
                    name: null,
                    url: null
                }
            }
            moreMidllewareName.unshift(middlewareName);
            if (lastIndex === 0) controllerProperty.routes[propertyKey].list[lastIndex].byPasses = moreMidllewareName;
            else {
                let byPasses = [];
                for (let i = 0; i < lastIndex; i++) {
                    let prevByPasses = controllerProperty.routes[propertyKey].list[i].byPasses;
                    prevByPasses.map(bypassName => {
                        if (!byPasses.includes(bypassName)) byPasses.push(bypassName);
                    });
                }
                moreMidllewareName.map(bypassName => {
                    if (!byPasses.includes(bypassName)) byPasses.push(bypassName);
                })
            }
        }
        defineMetadata(CONTROLLER_KEY, controllerProperty, target);
    }
}