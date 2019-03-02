import { INamespace } from "@base/utilities/namespace";
export interface Config {
    setConfig(config: any): any;
    getSection<T>(classImp: {
        new (): T;
    }, sectionName: string): T;
}
export interface App {
    config: Config;
    context: INamespace;
    type: "Worker" | "API";
    loadConfig(path: string): any;
    serveAs(type: "Worker" | "API"): any;
    use(plugin: Promise<boolean>, preStartApp: boolean): App;
    once(event: "preStartApp" | "startAppDone", cb: any): any;
    start(): any;
}
export interface IBaseEntity {
    getInstance(): any;
}
export interface IBaseRepository<T extends IBaseEntity> {
    find(conditions?: any): Promise<T[]>;
    findOne(conditions?: any): Promise<T>;
    findById(_id: string): Promise<T>;
    insert(doc: Partial<T>): any;
    insertMany(docs: Array<Partial<T>>): any;
    remove(conditions?: any): any;
    removeById(_id: string): any;
    removeMany(_ids: Array<string>): any;
    update(conditions: any, data: any): any;
    updateById(_id: string, data: any): any;
    updateMany(_ids: Array<string>, data: any): any;
    count(): any;
}
export interface UnitOfWork {
    list<T extends IBaseEntity>(name: string): IBaseRepository<T>;
    saveChanges(): Promise<any>;
}
