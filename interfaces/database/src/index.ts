import { 
	ConnectionOptions,Document, HookSyncCallback, Aggregate, HookErrorCallback,
	HookAsyncCallback, Model, Schema, Query, SchemaTypeOpts, ClientSession,
	SchemaOptions, Connection
} from "mongoose";
import { ILogger } from "@base-interfaces/logger";
import { INamespace } from "@base-interfaces/utilities";

export interface IUnitOfWorkMetadata{
	classes: { 
		[key: string]: { new(_collection: ICollection<IBaseEntity>): IBaseRepository<IBaseEntity> }
	};
	tracer: ILogger;
}

export interface IBaseEntity<T = any>{
	getInstance(): any;
}

export interface IDatabaseContext {
	list<T extends IBaseEntity>(name: string): ICollection<T>;
	saveChanges(): Promise<any>;
	createConnection(): Promise<boolean>;
	extend(plugins: Function | Function[]);
}

export interface IDatabaseContextSession{
	session: Promise<ClientSession>;
	documents: Array<IDocumentChange>;
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
	getContext(): IDatabaseContext;
	list<T extends IBaseEntity>(name: string): IBaseRepository<T>;
	saveChanges(): Promise<any>;
}

export interface IExtendDatabase{
	db: UnitOfWork;
}

export interface IDocumentChange {
	type: "REMOVE" | "INSERT" | "UPDATE";
	document: Document;
	data?: any;
}

export interface ICollection<T extends IBaseEntity> {
	aggregate(conditions: any[]): Promise<Partial<T>[]>;

	find(conditions: any): Promise<Partial<T>[]>;
	findOne(conditions: any): Promise<Partial<T>>;
	findById(_id: string): Promise<Partial<T>>;
	findByIds(_ids: Array<string>): Promise<Partial<T>[]>;

	insert(doc: Partial<T>): Promise<Partial<T>>;
	insertMany(docs: Array<Partial<T>>): Promise<Partial<T>[]>;

	remove(conditions: any): Promise<Partial<T>[]>;
	removeById(_id: string): Promise<Partial<T>>;
	removeMany(_ids: Array<string>): Promise<Partial<T>[]>;

	update(conditions: any, data: Partial<T>): Promise<Partial<T>[]>;
	updateById(_id: string, data: any): Promise<Partial<T>>;
	updateMany(_ids: Array<string>, data: any): Promise<Partial<T>[]>;

	count();
}

export interface IFakeSchemaFunction<T>{
	pre(method: HookAggregateType, fn: HookSyncCallback<Aggregate<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookAggregateType, paralel : boolean, fn: HookAsyncCallback<Aggregate<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookDocumentType, fn: HookSyncCallback<Document & T>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookDocumentType, paralel : boolean, fn: HookAsyncCallback<Document  & T>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookModelType, fn: HookSyncCallback<Model<Document & T, {}>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookModelType, paralel : boolean, fn: HookAsyncCallback<Model<Document & T, {}>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookQueryType, fn: HookSyncCallback<Query<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookQueryType, paralel : boolean, fn: HookAsyncCallback<Query<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	plugin(plugin: (schema: Schema) => void): IFakeSchemaFunction<T>;
	plugin<U>(plugin: (schema: Schema, options: U) => void, opts: U): IFakeSchemaFunction<T>; 
}

export interface ForeignFieldOptions{
	type: "one-to-one" | "one-to-many",
	load: "eager" | "lazy",
	refKey: string,
	localKey?: string,
	relatedEntity: string
}

export interface IEntitySchema<T> {
	name: string;
	definition?: EntitySchemaDefinition;
	virutals?: ((schema: Schema) => void)[],
	schemaOptions?: SchemaOptions;
	model?: Model<Document>;
	schema?: Schema;
	middleware?: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin>;
	tracer: ILogger;
}

export interface EntitySchemaDefinition {
	[key: string]: SchemaTypeOpts<any>;
}

export type HookAggregateType = "aggregate";
export type HookModelType = "insertMany";
export type HookDocumentType = "init" | "validate" | "save" | "remove";
export type HookQueryType = "count" | "find" | "findOne" | "findOneAndRemove" | "findOneAndUpdate" | "update" | "updateOne" | "updateMany";

type IFakeArg2 = HookErrorCallback;

export interface IFakeMiddleware{
	type: "plugin" | "preAggregate" | "preModel" | "preDocument" | "preQuery"
}

export interface IFakePreAggregate extends IFakeMiddleware {
	hook: HookAggregateType;
	arg0: IFakeAggregateArg0;
	arg1?: IFakeAggregateArg1;
	arg2?: IFakeArg2;
}

type IFakeAggregateArg0 = HookSyncCallback<Aggregate<any>> | boolean;
type IFakeAggregateArg1 = HookAsyncCallback<Aggregate<any>> | HookErrorCallback;

export interface IFakePreModel<T> extends IFakeMiddleware {
	hook: HookModelType;
	arg0: IFakeModelArg0<T>;
	arg1?: IFakeModelArg1<T>;
	arg2?: IFakeArg2;
}

type IFakeModelArg0<T> = HookSyncCallback<Model<Document & T, {}>> | boolean;
type IFakeModelArg1<T> = HookAsyncCallback<Model<Document & T, {}>> | HookErrorCallback;


export interface IFakePreDocument<T> extends IFakeMiddleware {
	hook: HookDocumentType;
	arg0: IFakeDocumentArg0<T>;
	arg1?: IFakeDocumentArg1<T>;
	arg2?: IFakeArg2;
}

type IFakeDocumentArg0<T> = HookSyncCallback<Document & T> | boolean;
type IFakeDocumentArg1<T> = HookAsyncCallback<Document & T> | HookErrorCallback;

export interface IFakePreQuery extends IFakeMiddleware {
	hook: HookQueryType;
	arg0: IFakeQueryArg0;
	arg1?: IFakeQueryArg1;
	arg2?: IFakeArg2;
}

type IFakeQueryArg0 = HookSyncCallback<Query<any>>| boolean;
type IFakeQueryArg1 = HookAsyncCallback<Query<any>> | HookErrorCallback;

export interface IFakePlugin<T = any> extends IFakeMiddleware {
	plugin: ((schema: Schema<any>) => void)  | ((schema: Schema<any>, options: T) => void);
	options?: T;
}


export interface IDbContextMetadata {
	context: INamespace;
	connectionInfo: {
		uri: string;
		connectionOptions: ConnectionOptions;
	};
	connection: Connection;
	classes: {
		[key: string]: {new () : IBaseEntity};
	},
	tracer: ILogger;
}

export interface ICollectionMetadata{
	dbContextClass: {new(): IDatabaseContext};
	tracer: ILogger;
}