import { INamespace } from "@base/utilities/dist/namespace";

export interface Config {
    setConfig(config: any);
    getSection<T>(classImp: { new(): T }, sectionName: string): T;
}

export interface App{
    config: Config;
    context: INamespace;
	type: "Worker" | "API";
    loadConfig(path: string);
    serveAs(type: "Worker" | "API");
	use(plugin: Function | Promise<boolean>, preStartApp: boolean): App;
	once(event: "preStartApp" | "startAppDone", cb);
}

export interface IBaseEntity{
	getInstance(): any;
}

export interface IBaseRepository<T extends IBaseEntity>{
	find(conditions?: any): Promise<T[]>;
	findOne(conditions?: any): Promise<T>;
	findById(_id: string): Promise<T>;

	insert(doc: Partial<T>);
	insertMany(docs: Array<Partial<T>>);

	remove(conditions?: any);
	removeById(_id: string);
	removeMany(_ids: Array<string>);

	update(conditions: any, data: any);
	updateById(_id: string, data: any);
	updateMany(_ids: Array<string>, data: any);

	count();
}

export interface UnitOfWork {
	list<T extends IBaseEntity>(name: string): IBaseRepository<T>;
	saveChanges(): Promise<any>;
}