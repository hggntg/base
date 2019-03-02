import "reflect-metadata";
import { App, Config } from "@base/interfaces";
import { INamespace } from "@base/utilities/namespace";
import { EventEmitter } from "events";
export declare const CONFIG: unique symbol;
export declare const APP: unique symbol;
export declare class AppImp implements App {
    private event;
    private preStartAppTasks;
    context: INamespace;
    type: "Worker" | "API";
    config: Config;
    constructor();
    loadConfig(path: string): void;
    serveAs(_type: "Worker" | "API"): void;
    use(plugin: Promise<any>, preStartApp: boolean): App;
    once(event: "preStartApp" | "startAppDone" | "appError", cb: any): EventEmitter;
    start(): void;
}
