import { INamespace } from "@base/utilities/namespace";

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
	use(plugin: Promise<boolean>, preStartApp: boolean): App;
	once(event: "preStartApp" | "startAppDone", cb);
	start();
}

export interface IBaseEntity{
	getInstance(): any;
}

export interface IBaseRepository<T extends IBaseEntity>{
	aggregate(conditions: any[]): Promise<Partial<T>[]>;

	find(conditions?: any): Promise<Partial<T>[]>;
	findOne(conditions?: any): Promise<Partial<T>>;
	findById(_id: string): Promise<Partial<T>>;

	insert(doc: Partial<T>): void;
	insertMany(docs: Array<Partial<T>>): void;

	remove(conditions?: any): void;
	removeById(_id: string): void;
	removeMany(_ids: Array<string>): void;

	update(conditions: any, data: any): void;
	updateById(_id: string, data: any): void;
	updateMany(_ids: Array<string>, data: any): void;

	count();
}

export interface UnitOfWork {
	list<T extends IBaseEntity>(name: string): IBaseRepository<T>;
	saveChanges(): Promise<any>;
}