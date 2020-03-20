import { INamespaceStatic } from "@base-interfaces/utilities";
export interface IConfig {
    setConfig(config: any);
    getSection<T>(classImp: { new(): T }, sectionName: string): T;
}

export interface IApp{
    config: IConfig;
    context: INamespaceStatic;
	type: "Worker" | "API";
    loadConfig(path: string);
    serveAs(type: "Worker" | "API");
	use(plugin: Promise<boolean>, preStartApp: boolean): IApp;
	once(event: "preStartApp" | "startAppDone", cb);
	start();
}