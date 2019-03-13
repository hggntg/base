import { Property, getMetadata, getClass, defineMetadata } from "@base/class";
import { SCHEMA_KEY } from "../../infrastructure/constant";
import { 
	IEntitySchema, ensureEntitySchemaInitiate, IFakePreAggregate,
	IFakePreDocument, HookDocumentType, HookModelType, IFakePreModel,
	HookAggregateType, HookQueryType, IFakePreQuery, IFakePlugin
} from "./entity-schema";
import mongoose from "mongoose";
import { IBaseEntity } from "@base/interfaces";


export function Id() {
	return function (target: object, propertyKey: string) {
		Property(target, propertyKey);
		let schema: IEntitySchema = getMetadata(SCHEMA_KEY, getClass(target));
		schema = ensureEntitySchemaInitiate(schema);
		schema.definition[propertyKey + "::-::_id"] = {
			type: mongoose.SchemaTypes.ObjectId,
			auto: true
		}
		defineMetadata(SCHEMA_KEY, schema, getClass(target));
	}
}

export function Field(name?: string | mongoose.SchemaTypeOpts<any>, entitySchemaField?: mongoose.SchemaTypeOpts<any>) {
	return function (target: object, propertyKey: string) {
		Property(target, propertyKey);
		let schema: IEntitySchema = getMetadata(SCHEMA_KEY, getClass(target));
		schema = ensureEntitySchemaInitiate(schema);
		if (!name) {
			name = propertyKey;
		}
		if (typeof name !== "string") {
			entitySchemaField = name;
			name = propertyKey;
		}
		schema.definition[propertyKey + "::-::" + name] = entitySchemaField;
		defineMetadata(SCHEMA_KEY, schema, getClass(target));
	}
}

export function RelatedField(name: string | IBaseEntity, relatedEntity?: IBaseEntity) {
	return function(target: object, propertyKey: string){
		Property(target, propertyKey);
		let schema: IEntitySchema = getMetadata(SCHEMA_KEY, getClass(target));
		schema = ensureEntitySchemaInitiate(schema);
		if(typeof name !== "string"){
			relatedEntity = name;
			name = propertyKey;
		}
		
	}
}

export interface IFakeSchemaFunction{
	pre(method: HookAggregateType, fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookAggregateType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookDocumentType, fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookDocumentType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookModelType, fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookModelType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookQueryType, fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookQueryType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	plugin(plugin: (schema: mongoose.Schema) => void): IFakeSchemaFunction;
	plugin<T>(plugin: (schema: mongoose.Schema, options: T) => void, opts: T): IFakeSchemaFunction; 
}

class FakeSchemaFunction implements IFakeSchemaFunction{
	private middleware: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery | IFakePlugin> = new Array();
	pre(method: HookAggregateType, fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookAggregateType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookDocumentType, fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookDocumentType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookModelType, fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookModelType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookQueryType, fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(method: HookQueryType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction;
	pre(
		hook: HookAggregateType | HookDocumentType | HookModelType | HookQueryType,
		arg0: boolean | mongoose.HookSyncCallback<mongoose.Aggregate<any>> | mongoose.HookSyncCallback<mongoose.Document> | mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>> | mongoose.HookSyncCallback<mongoose.Query<any>>,
		arg1?: mongoose.HookAsyncCallback<mongoose.Aggregate<any>> | mongoose.HookAsyncCallback<mongoose.Document> | mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>> | mongoose.HookAsyncCallback<mongoose.Query<any>> | mongoose.HookErrorCallback,
		arg2?: mongoose.HookErrorCallback) {
			let preFunction = {
				hook: hook,
				arg0: arg0,
				arg1: arg1,
				arg2: arg2
			};
			if(hook === "aggregate"){
				(preFunction as IFakePreAggregate).type = "preAggregate";
				this.middleware.push(preFunction as IFakePreAggregate);
			}
			else if(hook === "insertMany"){
				(preFunction as IFakePreModel).type = "preModel";
				this.middleware.push(preFunction as IFakePreModel);
			}
			else if(hook === "init" || hook === "save" || hook === "remove" || hook === "validate"){
				(preFunction as IFakePreDocument).type = "preDocument";
				this.middleware.push(preFunction as IFakePreDocument);
			}
			else{
				(preFunction as IFakePreQuery).type = "preQuery";
				this.middleware.push(preFunction as IFakePreQuery);
			}
			return this;
	}
	plugin(plugin: (schema: mongoose.Schema<any>) => void): IFakeSchemaFunction;
	plugin<T>(plugin: (schema: mongoose.Schema<any>, options: T) => void, opts: T): IFakeSchemaFunction;
	plugin<T = any>(plugin: ((schema: mongoose.Schema<any>) => void) | ((schema: mongoose.Schema<any>, options: T) => void), options?: T): IFakeSchemaFunction {
		let pluginFunction = {
			type: "plugin",
			plugin: plugin,
			options: options
		}
		this.middleware.push(pluginFunction as IFakePlugin);
		return this;
	}
	constructor(_middleware: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery | IFakePlugin> = new Array()){
		this.middleware = _middleware;
	}
}

function isSchemaOptions(input): input is mongoose.SchemaOptions{
	let isSchemaOption = 1;
	Object.keys(input).map(key => {
		isSchemaOption *= (<mongoose.SchemaOptions>input)[key] !== undefined ? 1 : 0;
	});
	return !!isSchemaOption;
}

export function Entity(options: mongoose.SchemaOptions): (target: any) => void;
export function Entity(name: string, options: mongoose.SchemaOptions): (target: any) => void;
export function Entity(options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction) => void): (target: any) => void;
export function Entity(name: string, options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction) => void): (target: any) => void;
export function Entity(arg0: string | mongoose.SchemaOptions, arg1?: mongoose.SchemaOptions | ((this: IFakeSchemaFunction) => void), arg2?: (this: IFakeSchemaFunction) => void): (target: any) => void{
	return function (target: any) {
		let schema: IEntitySchema = getMetadata(SCHEMA_KEY, getClass(target));	
		schema = ensureEntitySchemaInitiate(schema);
		schema.middleware = [];
		let hook : IFakeSchemaFunction = new FakeSchemaFunction(schema.middleware);
		if(typeof arg0 === "string" && isSchemaOptions(arg1) && typeof arg2 === "function"){
			schema.name = arg0;
			schema.schemaOptions = arg1;
			arg2.apply(hook);
		}
		else if(isSchemaOptions(arg0) && typeof arg2 === "function"){
			schema.name = target.name;
			schema.schemaOptions = arg0;
			arg2.apply(hook);
		}
		else if(typeof arg0 === "string" && isSchemaOptions(arg1)){
			schema.name = arg0;
			schema.schemaOptions = arg1;
		}
		else{
			schema.name = target.name;
			schema.schemaOptions = arg0 as mongoose.SchemaOptions;
		}
		defineMetadata(SCHEMA_KEY, schema, getClass(target));
	}
}