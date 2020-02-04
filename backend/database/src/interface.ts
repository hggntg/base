import {
	ConnectionOptions, Document, HookSyncCallback, Aggregate, HookErrorCallback,
	HookAsyncCallback, Model, Schema, Query, SchemaTypeOpts, ClientSession,
	SchemaOptions, Connection, QueryCursor
} from "mongoose";
// import { Express } from "express";
// import { Server } from "socket.io";

export interface IUnitOfWorkMetadata<T extends IDatabaseContext> {
	databaseContext: { new(): T },
	classes: {
		[key: string]: { new(): IBaseRepository<any, IBaseEntity> }
	}
}

export interface IBaseEntity<T = any> extends IBaseClass<T> {
	getInstance(): any;
}

export interface ITrackingOption {
	actor: {new<T extends IBaseEntity>(...args) : T}
}

export interface IDatabaseContext {
	list<K, T extends IBaseEntity<K>>(name: string): ICollection<K, T>;
	saveChanges(): Promise<any>;
	createConnection(): Promise<boolean>;
	extend(plugins: Function | Function[]);
	enableTracking(option: ITrackingOption): Promise<boolean>;
}

export interface IDatabaseContextSession {
	session: Promise<ClientSession>;
	documents: Array<IDocumentChange>;
}

export interface IWherable<K, T, Z> {
	where(conditions: any): IWherable<K, T, Z>;
	find(): T;
	findOne(): Z;
}

export interface IAggregateOption {
	allowDiskUse: boolean;
	cursor: {
		batchSize: number,
		useMongooseAggCursor: boolean
	}
}

export interface IAggregatable<T>{
	aggregate(pipelines: any[], options?: IAggregateOption): IAfterAggregate<T>;
}

export interface IAfterAggregate<T>{
	(fn: (document: Partial<T>) => any): Promise<boolean>;
}

export interface ILimitable<K, T, Z> extends IWherable<K, T, Z> {
	limit?<Q extends ILimitable<K, T, Z>>(this: Q, about: number): Omit<Q, "limit">;
}

export interface ISkipable<K, T, Z> extends IWherable<K, T, Z> {
	skip?<Q extends ISkipable<K, T, Z>>(this: Q, about: number): Omit<Q, "skip">;
}

export interface ISortable<K, T, Z> extends IWherable<K, T, Z> {
	sort?<Q extends ISortable<K, T, Z>>(this: Q, conditions: any): Omit<Q, "sort">;
}

export interface ICountable<T> {
	count?<K extends ICountable<T>>(this: K, what?: string): Promise<number>;
}

export interface ISelectable<T> {
	select?<K extends ISelectable<T>>(this: K, what?: string): Promise<IQueryResult<T>>;
}

export interface IRepositoryCountable<T> {
	count?<K extends IRepositoryCountable<T>>(this: K, what?: string): Promise<number>;
}

export interface IRepositorySelectable<T> {
	select?<K extends IRepositorySelectable<T>>(this: K, what?: string): Promise<IQueryResult<T>>;
}

export interface IQueryable<K, T, Z> extends ILimitable<K, T, Z>, ISkipable<K, T, Z>, ISortable<K, T, Z> {

}

export interface IInsertable<T> {
	insert(document: Partial<T>): Promise<Partial<T>>;
	insertMany(documents: Partial<T>[]): Promise<Partial<T>[]>;
}

export interface IRepositoryInsertable<T> {
	insert(document: Partial<T>): Promise<Partial<T>>;
	insertMany(documents: Partial<T>[]): Promise<Partial<T>[]>;
}

export interface IRestCommandable<T> {
	update(data: T): Promise<Partial<T> | Partial<T>[]>;
	remove(): Promise<Partial<T> | Partial<T>[]>;
	then<TResult1 = IQueryResult<T>, TResult2 = never>(onfulfilled?: ((value: IQueryResult<T>) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
}

export interface IRepositoryRestCommandableForOne<T> extends IRepositoryRestCommandable<T> {
	update(data: T): Promise<Partial<T>>;
	remove(): Promise<Partial<T>>;
}

export interface IRepositoryRestCommandable<T>{
	then<TResult1 = IQueryResult<T>, TResult2 = never>(onfulfilled?: ((value: IQueryResult<T>) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
}

export interface IAfterQueryable<T> extends IRestCommandable<T>, ISelectable<T>, ICountable<T> { }

export interface IRepositoryAfterQueryable<T> extends IRepositoryRestCommandable<T>, IRepositorySelectable<T>, IRepositoryCountable<T> {

}

export interface IBaseRepository<K, T extends IBaseEntity<K>> extends IQueryable<K, IRepositoryAfterQueryable<K>, IRepositoryRestCommandableForOne<K>>, IRepositoryInsertable<K>, IAggregatable<K> { }
export interface IRepositoryRestCommand<K, T extends IBaseEntity<K>> extends IRepositoryAfterQueryable<K> { }

export interface IUnitOfWork {
	getContext(): IDatabaseContext;
	list<K, T extends IBaseEntity<K>>(name: string): IBaseRepository<K, T>;
	saveChanges(): Promise<any>;
	// exposeUI(mode: "standalone", publicFolder: string, port: number): Promise<Express>;
	// exposeUI(mode: "attachment", publicFolder: string, socketIO: Server): Promise<Express>;
	// exposeUI(mode: "attachment", publicFolder: string, rootPath: string, socketIO: Server): Promise<Express>;
}

export interface IDocumentQuery {
	select?: string;
	limit?: number;
	skip?: number;
	sort?: any;
	where?: any;
	multi?: boolean;
}

export interface IDocumentChange {
	type: "REMOVE" | "INSERT" | "UPDATE";
	document: Document;
	data?: any;
}

export interface ICollection<K, T extends IBaseEntity<K>> extends IBaseClass<{ classImp: { new(): T } }>, IQueryable<K, IAfterQueryable<K>, IAfterQueryable<K>>, IInsertable<K>, IAggregatable<K> { }
export interface ICollectionRestCommand<T> extends IAfterQueryable<T> { }

export interface IFakeSchemaFunction<T>{
	pre(method: HookAggregateType, fn: HookSyncCallback<Aggregate<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookAggregateType, paralel: boolean, fn: HookAsyncCallback<Aggregate<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookDocumentType, fn: HookSyncCallback<Document & T>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookDocumentType, paralel: boolean, fn: HookAsyncCallback<Document & T>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookModelType, fn: HookSyncCallback<Model<Document & T, {}>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookModelType, paralel: boolean, fn: HookAsyncCallback<Model<Document & T, {}>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookQueryType, fn: HookSyncCallback<Query<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookQueryType, paralel: boolean, fn: HookAsyncCallback<Query<any>>, errorCb?: HookErrorCallback): IFakeSchemaFunction<T>;
	plugin(plugin: (schema: Schema) => void): IFakeSchemaFunction<T>;
	plugin<U>(plugin: (schema: Schema, options: U) => void, opts: U): IFakeSchemaFunction<T>;
	index(fielfds: {[key in keyof T]: 1 | -1}): IFakeSchemaFunction<T>;
}

export interface ForeignFieldOptions<T> {
	type: "one-to-one" | "one-to-many",
	load: "eager" | "lazy",
	refKey: string,
	localKey?: string,
	relatedEntity: {new(...args): T}
}

export interface ForeignFieldOptionsWithBrigde<T> {
	type: "one-to-many",
	load: "eager" | "lazy",
	refKey: string,
	localKey?: string,
	bridgeKey: string,
	bridgeEntity: {new(...args): T},
	relatedEntity: {new(...args): T}
}

export interface IEntitySchema<T> {
	name: string;
	definition?: EntitySchemaDefinition;
	virutals?: ((schema: Schema) => void)[];
	schemaOptions?: SchemaOptions;
	model?: Model<Document>;
	schema?: Schema;
	middleware?: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin>;
	indexes?: ((schema: Schema) => void)[];
}

export interface EntitySchemaDefinition {
	[key: string]: SchemaTypeOpts<any>;
}

export type HookAggregateType = "aggregate";
export type HookModelType = "insertMany";
export type HookDocumentType = "init" | "validate" | "save" | "remove";
export type HookQueryType = "count" | "find" | "findOne" | "findOneAndRemove" | "findOneAndUpdate" | "update" | "updateOne" | "updateMany";

type IFakeArg2 = HookErrorCallback;


export interface IFakeMiddleware {
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

type IFakeQueryArg0 = HookSyncCallback<Query<any>> | boolean;
type IFakeQueryArg1 = HookAsyncCallback<Query<any>> | HookErrorCallback;

export interface IFakePlugin<T = any> extends IFakeMiddleware {
	plugin: ((schema: Schema<any>) => void) | ((schema: Schema<any>, options: T) => void);
	options?: T;
}

export interface IFieldUI {
	name: string;
	type: "input" | "textarea";
	hidden?: boolean;
	disabled?: boolean;
}

export interface IFieldUIList {
	[key: string]: IFieldUI
}

export interface IEntityUI {
	name: string;
	slug: string;
	columns: string[];
	fields: IFieldUIList;
}

export interface IEntityUIList {
	entities: {
		[key: string]: IEntityUI;
	};
}

export interface IUnitOfWorkUI {
	uow: IUnitOfWork;
	repositories: {
		[key: string]: string;
	};
	entityUIList: IEntityUIList;
}

export interface IDbContextMetadata {
	context: INamespace;
	connectionInfo: {
		uri: string;
		connectionOptions: ConnectionOptions;
	};
	connection: Connection;
	classes: {
		[key: string]: { new(): IBaseEntity };
	};
	tracker?: any;
}

export interface ICollectionMetadata {
	dbContextClass: { new(): IDatabaseContext };
}

export interface IRepositoryMetadata<K, T extends IBaseEntity<K>> {
	entity: { new(): T }
}

export interface IQueryInput {
	skip?: number;
	limit?: number;
	sort?: any;
	select?: string;
	where?: any;
}

export interface IQueryResult<T> {
	total: number;
	end: boolean;
	page: number;
	numOfRecords: number;
	value: Partial<T>[];
}

export interface IRepositoryQuery {
	[key: string]: any;
}

export type TEntityForeignField<T> = (ForeignFieldOptions<T> & { name: string; localField: string, hide: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T>  & { name: string; localField: string, hide?: "all" | string[] });
