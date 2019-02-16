process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
import * as dotenv from "dotenv";
import "reflect-metadata";
import { Container, ContainerModule, interfaces, injectable, inject } from "inversify";
import { IConfig } from "config";
import * as objectPath from "object-path";
import { mapData } from "@base/class";
import { App, Config } from "@base/interfaces";
import { INamespace, Namespace } from "@base/utilities/dist/namespace";
import { EventEmitter } from "events";

export const CONFIG = Symbol.for("Config");
export const APP = Symbol.for("App");

const ContainerRoot: Container = new Container();

@injectable()
abstract class ConfigAbs implements Config {
    abstract setConfig(config: any);
    abstract getSection<T>(classImp: { new(): T }, sectionName: string): T;
    protected configRoot: any;
    constructor() {

    }
}

class DoubleConfigImp extends ConfigAbs {
    constructor() {
        super();
    }
    setConfig(_configRoot: IConfig) {
        this.configRoot = _configRoot;
    }
    getSection<T>(ClassImp: { new(): T }, sectionName: string): T {
        let dynamicResult = objectPath.get<T>(this.configRoot, sectionName, null);
        return mapData<T>(ClassImp, dynamicResult);
    }
}

@injectable()
export class AppImp implements App {
    private event: EventEmitter;
    private preStartAppTasks: Array<Function | Promise<any>>;
    context: INamespace;
    type: "Worker" | "API";
    config: Config;
    constructor() {
        this.event = new EventEmitter();
        this.preStartAppTasks = new Array();
        this.context = Namespace;
        this.once("preStartApp", () => {
            console.log("App is initializing");
            let promiseList = [];
            this.preStartAppTasks.map(preTask => {
                if(preTask instanceof Promise){
                    promiseList.push(preTask);
                }
            });
            Promise.all(promiseList).then((result) => {
                console.log(result);
                this.event.emit("startAppDone", null);
            }).catch(e =>{
                throw new Error(e);
            });
        });
        this.once("startAppDone", () => {
            console.log("App is started successfuly");
        });
    }
    loadConfig(path: string) {
        let envConfig = dotenv.config({ path: path });
        if (envConfig.error) {
            throw envConfig.error;
        }
        let configPath = envConfig.parsed.NODE_CONFIG_DIR;
        if (!configPath) {
            throw new Error("Missing NODE_CONFIG_DIR in .env");
        }
        let config = require("config");
        this.config = ContainerRoot.get<Config>(CONFIG);
        this.config.setConfig(config);
    }
    serveAs(_type: "Worker" | "API") {
        this.type = _type;
    }
    use(plugin: Function | Promise<any>, preStartApp: boolean): App {
        if(preStartApp){
            this.preStartAppTasks.push(plugin);
        }
        return this;
    }
    once(event: "preStartApp" | "startAppDone", cb) {
        return this.event.once(event, cb);
    }
    start() {
        this.event.emit("preStartApp", null);
    }
}

const APP_MODULE = new ContainerModule((bind: interfaces.Bind) => {
    bind<Config>(CONFIG).to(DoubleConfigImp);
    bind<App>(APP).to(AppImp);
});

ContainerRoot.load(APP_MODULE);

/*

import * as dotenv from "dotenv";

import { Container } from "inversify";
import { APP_MODULE, Config, App } from "./model";
import { CONFIG, APP } from "./shared/constant";

import express from "express";
import { json, urlencoded} from "body-parser";
import morgan from "morgan";
import { Namespace } from "./shared/namespace";
import { uuidv1 } from "./index";
import { IController, getController } from "./main/controller";
import { UnitOfWorkAbs } from "./main/entity";


export const ContainerRoot: Container = new Container();

export interface AppRoute{
    base: express.Express;
    controllers: {
        [key: string]  : {new(unitOfWork: UnitOfWorkAbs) : IController}
    }
}

export interface AppRoot {
    route: AppRoute;
    setting: App;
    type: "Worker" | "WebAPI";
    dbContext?: object;
    loadConfig(path: string);
    useAs(type: "Worker" | "WebAPI");
    registerController(modules);
    start(unitOfWork: UnitOfWorkAbs);
}

class AppRootImp implements AppRoot {
    route: AppRoute;
    setting: App;
    type: "Worker" | "WebAPI";
    dbContext?: object;
    loadConfig(path: string) {
        let envConfig = dotenv.config({ path: path });
        if (envConfig.error) {
            throw envConfig.error;
        }
        let configPath = envConfig.parsed.NODE_CONFIG_DIR;
        if (!configPath) {
            throw new Error("Missing NODE_CONFIG_DIR in .env");
        }
        let config = require("config");
        this.setting = ContainerRoot.get<App>(APP);
        this.setting.config = ContainerRoot.get<Config>(CONFIG);
        this.setting.config.setConfig(config);
    }
    useAs(_type: "Worker" | "WebAPI") {
        this.type = _type;
    }
    registerController(controllers){
        if(this.type === "WebAPI"){
            if(!this.route){
                this.route = {
                    base: null,
                    controllers: {}
                }
            }
            Object.keys(controllers).map(controllerKey => {
                this.route.controllers[controllerKey] = controllers[controllerKey];
            });
        }
    }
    start(unitOfWork: UnitOfWorkAbs) {
        let namespace = Namespace.create("dbContext");
        if (this.type === "WebAPI") {
            if(!this.route){
                this.route = {
                    base: express(),
                    controllers: {}
                }
            }
            if(!this.route.base){
                this.route.base = express();
            }
            this.route.base.use(json({}));
            this.route.base.use(urlencoded({extended: true}));
            this.route.base.use(morgan("combined"))
            this.route.base.use((req, res, next) => {
                namespace.run(async () => {
                    namespace.set("tid", uuidv1());
                    next();
                });
                res.once("finish", () => {
                    namespace.dispose();
                });
            });
            Object.keys(this.route.controllers).map(controllerKey => {
                let classImp = this.route.controllers[controllerKey];
                let controller = new classImp(unitOfWork);
                let controllerProperty = getController(classImp);
                this.route.base.use(controllerProperty.routeBase, controller.subApp);
            });
            this.route.base.listen(3000, () => {
                console.log(`
                ---------------------------------------------------------------------
                ---------------------------------------------------------------------
                --------------------- Server start at port 3000 ---------------------
                ---------------------------------------------------------------------
                ---------------------------------------------------------------------
                `);
            });
        }
        else {

        }
    }
}


ContainerRoot.load(APP_MODULE);
export const APP_ROOT_INSTANCE: AppRoot = new AppRootImp();

*/
