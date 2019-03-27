import * as dotenv from "dotenv";
import "reflect-metadata";
import { Container, ContainerModule, interfaces, injectable } from "inversify";
import { IConfig } from "config";
import * as objectPath from "object-path";
import { mapData } from "@base/class";
import { App, Config } from "@base/interfaces";
import { INamespace, Namespace } from "@base/utilities/namespace";
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
    private preStartAppTasks: Array<Promise<any>>;
    context: INamespace;
    type: "Worker" | "API";
    config: Config;
    constructor() {
        this.event = new EventEmitter();
        this.preStartAppTasks = new Array();
        this.context = Namespace;
        this.once("preStartApp", () => {
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
    use(plugin: Promise<any>, preStartApp: boolean): App {
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

const APP_MODULE = new ContainerModule((bind: interfaces.Bind) => {
    bind<Config>(CONFIG).to(DoubleConfigImp);
    bind<App>(APP).to(AppImp);
});

ContainerRoot.load(APP_MODULE);