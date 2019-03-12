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

export interface IFakePreAggregate {
	hook: HookAggregateType;
	arg0: mongoose.HookSyncCallback<mongoose.Aggregate<any>> | boolean;
	arg1?: mongoose.HookAsyncCallback<mongoose.Aggregate<any>> | mongoose.HookErrorCallback;
	arg2?: IFakeArg2;
}

type IFakeAggregateArg0 = mongoose.HookSyncCallback<mongoose.Aggregate<any>> | boolean;
type IFakeAggregateArg1 = mongoose.HookAsyncCallback<mongoose.Aggregate<any>> | mongoose.HookErrorCallback;

export interface IFakePreModel{
	hook: HookModelType;
	arg0: IFakeModelArg0;
	arg1?: IFakeModelArg1;
	arg2?: IFakeArg2;
}

type IFakeModelArg0 = mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>> | boolean;
type IFakeModelArg1 = mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>> | mongoose.HookErrorCallback;


export interface IFakePreDocument{
	hook: HookDocumentType;
	arg0: IFakeDocumentArg0;
	arg1?: IFakeDocumentArg1;
	arg2?: IFakeArg2;
}

type IFakeDocumentArg0 = mongoose.HookSyncCallback<mongoose.Document> | boolean;
type IFakeDocumentArg1 = mongoose.HookAsyncCallback<mongoose.Document> | mongoose.HookErrorCallback;

export interface IFakePreQuery{
	hook: HookQueryType;
	arg0: mongoose.HookSyncCallback<mongoose.Query<any>>| boolean;
	arg1?: mongoose.HookAsyncCallback<mongoose.Query<any>> | mongoose.HookErrorCallback;
	arg2?: IFakeArg2;
}

type IFakeQueryArg0 = mongoose.HookSyncCallback<mongoose.Query<any>>| boolean;
type IFakeQueryArg1 = mongoose.HookAsyncCallback<mongoose.Query<any>> | mongoose.HookErrorCallback;

export interface IEntitySchema {
	name: string;
	definition?: EntitySchemaDefinition;
	schemaOptions?: mongoose.SchemaOptions;
	model?: mongoose.Model<mongoose.Document>;
	schema?: mongoose.Schema;
	preFunction?: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery>;
}

export class EntitySchema implements IEntitySchema {
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
	preFunction?: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery> = new Array(); 

	constructor() {
		this.definition = {};
		this.schemaOptions = {};
	}
}

export function ensureEntitySchemaInitiate(input: EntitySchema) {
	let output = ensureNew<EntitySchema>(EntitySchema, input || new EntitySchema());
	return output;
}

export function getEntitySchema(target: any){
	let classImp = getClass(target);
	let schemaEntity = getMetadata(SCHEMA_KEY, classImp);
	return schemaEntity;
}