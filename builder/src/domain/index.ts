import * as dotenv from "dotenv";
import { IConfig } from "config";
import * as objectPath from "object-path";
import { mapData, Injectable, getDependency, use } from "@base/class";
import { IApp, IConfig as IBaseConfig, IAppProperty} from "../interface";
import { LOGGER_SERVICE, ILogger } from "@base/logger";
import { INamespaceStatic } from "@base/class/interface";
import { Namespace } from "@base/class/utilities/namespace";
import { EventEmitter } from "events";

export const CONFIG = Symbol.for("Config");
export const APP = Symbol.for("App");

export const CONFIG_SERVICE = "IBaseConfig";

@Injectable(CONFIG_SERVICE, true)
abstract class AConfig implements IBaseConfig {
    abstract setConfig(config: any);
    abstract getSection<T>(classImp: { new(): T }, sectionName: string): T;
    protected configRoot: any;
    constructor() {}
}

@Injectable(CONFIG_SERVICE, true, true)
class DoubleConfig extends AConfig {
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

export const APP_SERVICE = "IApp";

@Injectable(APP_SERVICE, false, true)
export class App implements IApp {
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    private logTag = "main-app";
    log(message: string);
    log(obj: object);
    log(arg0: any) {
        if(typeof arg0 === "string"){
            this.logger.pushLog(arg0, "silly", this.logTag);
        }
        else{
            this.logger.pushLog(JSON.stringify(arg0), "silly", this.logTag);
        }
    }
    error(error: string);
    error(error: Error);
    error(error: any) {
        this.logger.pushError(error, this.logTag);
    }
    debug(message: string);
    debug(obj: object);
    debug(arg0: any) {
        this.logger.pushDebug(arg0, this.logTag);
    }
    info(message: string) {
        this.logger.pushInfo(message, this.logTag);
    }

    private event: EventEmitter;
    private preStartAppTasks: Array<Promise<any>>;
    context: INamespaceStatic;
    type: "Worker" | "API";
    config: IBaseConfig;
    initValue(input: Partial<IAppProperty>){
        this.logger.trace(true);
        this.logTag = input.logTag;
        this.logger.initValue({appName : input.appName});
    }
    constructor(@use(LOGGER_SERVICE) private logger: ILogger) {
        this.event = new EventEmitter();
        this.preStartAppTasks = new Array();
        this.context = Namespace;
        this.once("preStartApp", () => {
            this.info("Preparing for starting app");
            let promiseList = [];
            this.preStartAppTasks.map(preTask => {
                promiseList.push(preTask);
            });
            Promise.all(promiseList).then((sucess) => {
                this.event.emit("startAppDone", null);
            }).catch(err => {
                throw new Error(err);
            });
        });
        this.once("startAppDone", () => {
            this.info("Application is started");
        });
    }
    loadConfig(path: string) {
        this.info("Reading config from " + path);
        let envConfig = dotenv.config({ path: path });
        if (envConfig.error) {
            throw envConfig.error;
        }
        let configPath = envConfig.parsed.NODE_CONFIG_DIR;
        if (!configPath) {
            throw new Error("Missing NODE_CONFIG_DIR in .env");
        }
        let config = require("config");
        this.config = getDependency<IBaseConfig>(CONFIG_SERVICE, true);
        this.config.setConfig(config);
    }
    serveAs(_type: "Worker" | "API") {
        this.type = _type;
    }
    use(plugin: Promise<any>, preStartApp: boolean): IApp {
        try {
            if (preStartApp) {
                this.preStartAppTasks.push(plugin);
            }
        }
        catch (e) {
            throw new Error(e);
        }
        return this;
    }
    once(event: "preStartApp" | "startAppDone" | "appError", cb) {
        return this.event.once(event, cb);
    }
    start() {
        this.event.emit("preStartApp", null);
    }
}