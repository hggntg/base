import { INamespaceStatic } from "@base/class/interface";
export interface IConfig {
    setConfig(config: any);
    getSection<T>(classImp: { new(): T }, sectionName: string): T;
}

export interface IAppProperty{
    aliases: {[key: string]: string};
    root: string;
    appName: string;
    logTag: string;
}

export interface IApp extends IBaseClass<IAppProperty>{
    config: IConfig;
    context: INamespaceStatic;
    type: "Worker" | "API";
    log(message: string);
    log(obj: object);
    error(error: string);
    error(error: Error);
    debug(message: string);
    debug(obj: object);
    info(message: string);
    loadConfig(path: string);
    serveAs(type: "Worker" | "API");
	use(plugin: Promise<boolean>, preStartApp: boolean): IApp;
	once(event: "preStartApp" | "startAppDone", cb);
	start();
}