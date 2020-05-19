export interface IConfig {
    setConfig(config: any);
    getSection<T>(classImp: { new(): T }, sectionName: string): T;
}

export interface IAppProperty{
    aliases: {[key: string]: string};
    root: string;
    appName: string;
}

export interface IAppEvent {
    event: string;
    description: string;
    level: "green" | "red";
    meta: any;
    needToRestart: boolean;
}

export interface IApp extends IBaseClass<IAppProperty>{
    config: IConfig;
    context: INamespaceStatic;
    type: "Worker" | "API";
    loadConfig(path: string);
    serveAs(type: "Worker" | "API");
    use(plugin: Promise<boolean>, preStartApp: boolean): IApp;
    report(event: IAppEvent);
	once(event: "preStartApp" | "startAppDone", cb);
	start();
}