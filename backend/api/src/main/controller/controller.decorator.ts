import express from "express";
import { CONTROLLER_KEY } from "../../shared/constant";
import { Property, getProperties, getMetadata, defineMetadata, getClass } from "@base/class";
import { UnitOfWork, App } from "@base/interfaces";
import { IExtendApi } from "../../internal";

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
                let result = this[property](checkInput(req, res));
                if(typeof result.then === "function" && typeof result.catch === "function"){
                    result.then((value) => {
                        res.json(value);
                    }).catch(err => {
                        res.json(err);
                    });
                }
                else{
                    res.json(result);
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

function checkInput(req: express.Request, res: express.Response){
    let input = {
        query: req.query,
        params: req.params,
        body: req.body
    }
    return input;
}