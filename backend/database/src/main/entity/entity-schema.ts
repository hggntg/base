import mongoose from "mongoose";
import { Property, getClass, getMetadata } from "@base/class";
import { ensureNew } from "../../infrastructure/utilities";
import { SCHEMA_KEY } from "../../infrastructure/constant";
interface EntitySchemaDefinition {
	[key: string]: mongoose.SchemaTypeOpts<any>
}

export type HookAggregateType = "aggregate";
export type HookModelType = "insertMany";
export type HookDocumentType = "init" | "validate" | "save" | "remove";
export type HookQueryType = "count" | "find" | "findOne" | "findOneAndRemove" | "findOneAndUpdate" | "update" | "updateOne" | "updateMany";

type IFakeArg2 = mongoose.HookErrorCallback;

interface IFakeMiddleware{
	type: "plugin" | "preAggregate" | "preModel" | "preDocument" | "preQuery"
}

export interface IFakePreAggregate extends IFakeMiddleware {
	hook: HookAggregateType;
	arg0: IFakeAggregateArg0;
	arg1?: IFakeAggregateArg1;
	arg2?: IFakeArg2;
}

type IFakeAggregateArg0 = mongoose.HookSyncCallback<mongoose.Aggregate<any>> | boolean;
type IFakeAggregateArg1 = mongoose.HookAsyncCallback<mongoose.Aggregate<any>> | mongoose.HookErrorCallback;

export interface IFakePreModel<T> extends IFakeMiddleware {
	hook: HookModelType;
	arg0: IFakeModelArg0<T>;
	arg1?: IFakeModelArg1<T>;
	arg2?: IFakeArg2;
}

type IFakeModelArg0<T> = mongoose.HookSyncCallback<mongoose.Model<mongoose.Document & T, {}>> | boolean;
type IFakeModelArg1<T> = mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document & T, {}>> | mongoose.HookErrorCallback;


export interface IFakePreDocument<T> extends IFakeMiddleware {
	hook: HookDocumentType;
	arg0: IFakeDocumentArg0<T>;
	arg1?: IFakeDocumentArg1<T>;
	arg2?: IFakeArg2;
}

type IFakeDocumentArg0<T> = mongoose.HookSyncCallback<mongoose.Document & T> | boolean;
type IFakeDocumentArg1<T> = mongoose.HookAsyncCallback<mongoose.Document & T> | mongoose.HookErrorCallback;

export interface IFakePreQuery extends IFakeMiddleware {
	hook: HookQueryType;
	arg0: IFakeQueryArg0;
	arg1?: IFakeQueryArg1;
	arg2?: IFakeArg2;
}

type IFakeQueryArg0 = mongoose.HookSyncCallback<mongoose.Query<any>>| boolean;
type IFakeQueryArg1 = mongoose.HookAsyncCallback<mongoose.Query<any>> | mongoose.HookErrorCallback;

export interface IFakePlugin<T = any> extends IFakeMiddleware {
	plugin: ((schema: mongoose.Schema<any>) => void)  | ((schema: mongoose.Schema<any>, options: T) => void);
	options?: T;
}

export interface IEntitySchema<T> {
	name: string;
	definition?: EntitySchemaDefinition;
	schemaOptions?: mongoose.SchemaOptions;
	model?: mongoose.Model<mongoose.Document>;
	schema?: mongoose.Schema;
	middleware?: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin>;
}

export class EntitySchema<T> implements IEntitySchema<T> {

	@Property
	name: string;

	@Property
	definition?: EntitySchemaDefinition;

	@Property
	schemaOptions?: mongoose.SchemaOptions;

	@Property
	model?: mongoose.Model<mongoose.Document, {}>;

	@Property
	schema?: mongoose.Schema<any>;

	@Property
	middleware?: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = [];

	constructor() {
		this.definition = {};
		this.schemaOptions = {};
	}
}

export function ensureEntitySchemaInitiate<T>(input: EntitySchema<T>) {
	let output = ensureNew<EntitySchema<T>>(EntitySchema, input || new EntitySchema());
	return output;
}

export function getEntitySchema(target: any){
	let classImp = getClass(target);
	let schemaEntity = getMetadata(SCHEMA_KEY, classImp);
	return schemaEntity;
}