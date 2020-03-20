import * as objectPath from "object-path";
import fs from "fs";
import { IApp, IConfig as IBaseConfig, IAppProperty } from "@app/interface";
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
        let data = mapData<T>(ClassImp, dynamicResult);
        if(data.error) handleError(data.error)
        return data.value ? data.value : null;
    }
}

export const APP_SERVICE = "IApp";

@Injectable(APP_SERVICE, false, true)
export class App implements IApp {
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }

    private logger: ILogger;
    private event: EventEmitter;
    private preStartAppTasks: Array<Promise<any>>;
    context: INamespaceStatic;
    type: "Worker" | "API";
    config: IBaseConfig;
    init(input: Partial<IAppProperty>) {
        this.logger.trace(true);
        this.logger.init({ appName: input.appName });
        if (input.aliases) {
            let aliases = Object.keys(input.aliases);
            Object.values(input.aliases).map((target, index) => {
                addAlias("@" + aliases[index], target);
            });
        }
    }
    constructor() {
        this.logger = getDependency(LOGGER_SERVICE);
        this.event = new EventEmitter();
        this.preStartAppTasks = new Array();
        this.context = Namespace;
        this.once("preStartApp", () => {
            console.info("Preparing for starting app");
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
            console.info("Application is started");
        });
    }
    loadConfig(path: string) {
        if (fs.existsSync(path)) {
            console.info("Reading config from " + path);
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
        if(process.env["NODE_ENV"] !== "development"){
            this.logger.setColor(false);
            this.logger.setLevel("warn");
            this.logger.setDisplayAppName(false);
        }
        else {
            this.logger.setColor(true);
            this.logger.setLevel("silly");
            this.logger.setDisplayAppName(true);
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