import express from "express";
import { UnitOfWork } from "@base/interfaces";
interface Route {
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
}
interface Controller {
    name: string;
    routeBase: string;
    routes: {
        [key: string]: Route;
    };
}
export interface IController {
    subApp: express.Express;
    uowInstance: UnitOfWork;
}
export declare class ControllerImp implements IController {
    subApp: express.Express;
    uowInstance: UnitOfWork;
    constructor(_uowInstance: UnitOfWork);
    private register;
}
export declare function Controller(routeBase: string): (target: any) => void;
export declare function Route(routeConfig: Route): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function getController(target: any): Controller;
export {};
