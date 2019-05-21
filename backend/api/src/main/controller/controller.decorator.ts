import express from "express";
import { CONTROLLER_KEY } from "../../shared/constant";
import { Property, getProperties, getMetadata, defineMetadata, getClass } from "@base/class";
import { UnitOfWork, App } from "@base/interfaces";
import { IExtendApi } from "../../internal";
import { IncomingHttpHeaders } from "http";
import { Stream } from "stream";

declare const app: App & IExtendApi;

interface Route {
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
}
interface Controller {
    name: string;
    routeBase: string;
    routes: {
        [key: string]: Route
    }
}

export interface IController {
    subApp: express.Express;
    uowInstance: UnitOfWork;
}

export class ControllerImp implements IController {
    subApp: express.Express;
    uowInstance: UnitOfWork;
    constructor(_uowInstance: UnitOfWork) {
        this.subApp = express();
        this.uowInstance = _uowInstance;
        this.register();
    }
    private register() {
        let controllerProperty: Controller = getMetadata(CONTROLLER_KEY, getClass(this));
        let properties = getProperties(getClass(this));
        properties.map(property => {
            let routeConfig = controllerProperty.routes[property];
            this.subApp[routeConfig.method.toLowerCase()](routeConfig.url, (req: express.Request, res: express.Response) => {
                let result = this[property](checkInput(req));
                if(result instanceof Stream){
                    result.pipe(res);
                    res.once("drain", () => {
                        console.log("It's was drain");
                    });
                }
                else if(typeof result.then === "function" && typeof result.catch === "function"){
                    result.then((value) => {
                        res.json({results: value});
                    }).catch(err => {
                        res.status(500).json({status: "error", message: err.message});
                    });
                }
                else{
                    res.json({results: result});
                }
            });
        });
    }
}

export function Controller(routeBase: string) {
    return function (target: any) {
        let classImp = getClass(target);
        let controllerProperty: Controller = getMetadata(CONTROLLER_KEY, classImp);
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {

                }
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

export function Route(routeConfig: Route) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Property(target, propertyKey);
        let controllerProperty: Controller = getMetadata(CONTROLLER_KEY, getClass(target));
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {

                }
            };
        }
        if(routeConfig.url.indexOf("/") !== 0){
            routeConfig.url = "/" + routeConfig.url;
        }
        controllerProperty.routes[propertyKey] = routeConfig;
        defineMetadata(CONTROLLER_KEY, controllerProperty, target.constructor);
    }
}

export function getController(target: any): Controller {
    let classImp = getClass(target);
    let controllerProperty: Controller = getMetadata(CONTROLLER_KEY, classImp);
    return controllerProperty;
}

export interface IReqestParam{
    query: {
        [key in string]: any
    };
    params:{
        [key in string]: any
    };
    body:{
        [key in string]: any
    },
    headers: IncomingHttpHeaders
}

function checkInput(req: express.Request){
    let input: IReqestParam = {
        query: req.query,
        params: req.params,
        body: req.body,
        headers: req.headers
    }
    return input;
}