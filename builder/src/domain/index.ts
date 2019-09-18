import * as objectPath from "object-path";
import fs from "fs";
import { mapData, Injectable, getDependency, use } from "@base/class";
import { IApp, IConfig as IBaseConfig, IAppProperty } from "@app/interface";
import { LOGGER_SERVICE, ILogger } from "@base/logger";
import { INamespaceStatic } from "@base/class/interface";
import { Namespace } from "@base/class/utilities/namespace";
import { EventEmitter } from "events";
import { join } from "path";

export const CONFIG = Symbol.for("Config");
export const APP = Symbol.for("App");
export const CONFIG_SERVICE = "IBaseConfig";

@Injectable(CONFIG_SERVICE, true)
abstract class AConfig implements IBaseConfig {
    abstract setConfig(config: any);
    abstract getSection<T>(classImp: { new(): T }, sectionName: string): T;
    protected configRoot: any;
    constructor() { }
}

@Injectable(CONFIG_SERVICE, true, true)
class DoubleConfig extends AConfig {
    constructor() {
        super();
    }
    setConfig(_configRoot) {
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
        if (typeof arg0 === "string") {
            this.logger.pushLog(arg0, "silly", this.logTag);
        }
        else {
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
    initValue(input: Partial<IAppProperty>) {
        this.logger.trace(true);
        this.logTag = input.logTag;
        this.logger.initValue({ appName: input.appName });
        if (input.aliases) {
            let aliases = Object.keys(input.aliases);
            Object.values(input.aliases).map((target, index) => {
                addAlias("@" + aliases[index], target);
            });
        }
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
        if (fs.existsSync(path)) {
            this.info("Reading config from " + path);
            let env = fs.readFileSync(path, { encoding: "utf8" }).toString();
            let envSegment = env.split("\n");
            envSegment = envSegment.map(envItem => {
                let envItemSegment = envItem.split("=");
                envItemSegment = envItemSegment.map(innerEnvItem => {
                    return innerEnvItem.trim();
                });
                return envItemSegment.join("=");
            })
            envSegment.map(envItem => {
                let envItemSegment = envItem.split("=");
                if (envItemSegment[0] === "NODE_ENV" || !process.env[envItemSegment[0]]) {
                    process.env[envItemSegment[0]] = envItemSegment[1];
                }
            });
        }
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = "development";
        }
        if (!process.env.NODE_CONFIG_DIR) {
            throw new Error("Missing config directory");
        }
        let configDir = join(process.cwd(), process.env.NODE_CONFIG_DIR);
        if(fs.existsSync(configDir)){
            let configFileName = process.env.NODE_ENV + ".json";
            if (configFileName === "development.json") {
                if (!fs.existsSync(join(configDir, configFileName))) {
                    configFileName = "default.json";
                }
            }
            let configFilePath = join(configDir, configFileName);
            if (fs.existsSync(configFilePath)) {
                let configString = fs.readFileSync(configFilePath, { encoding: "utf8" });
                configString = configString.replace(/\n/g, " ").replace(/\s\s/g, " ");
                try {
                    let config = JSON.parse(configString);
                    this.config = getDependency(CONFIG_SERVICE, true);
                    this.config.setConfig(config);
                }
                catch(e){
                    throw e;
                }
            }
            else {
                throw new Error("Missing config file for environment " + process.env.NODE_ENV);
            }
        }
        else {
            throw new Error("Missing config dir at path " + process.env.NODE_CONFIG_DIR);
        }
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