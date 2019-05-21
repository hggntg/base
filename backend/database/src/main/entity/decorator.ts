import { Property, getMetadata, getClass, defineMetadata } from "@base/class";
import { SCHEMA_KEY, FOREIGN_KEY } from "../../infrastructure/constant";
import { 
	IEntitySchema, IFakePreAggregate,
	IFakePreDocument, HookDocumentType, HookModelType, IFakePreModel,
	HookAggregateType, HookQueryType, IFakePreQuery, IFakePlugin, ForeignFieldOptions, IFakeSchemaFunction
} from "@base-interfaces/database";
import { ensureEntitySchemaInitiate } from "./entity-schema";
import mongoose from "mongoose";
import { ILogger } from "@base-interfaces/logger";
import { Logger } from "@base/logger";


export function Id() {
	return function (target: object, propertyKey: string) {
		Property(target, propertyKey);
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getMetadata(SCHEMA_KEY, classImp);
		schema = ensureEntitySchemaInitiate(schema);
		schema.definition[propertyKey + "::-::_id"] = {
			type: mongoose.SchemaTypes.ObjectId,
			auto: true
		}
		defineMetadata(SCHEMA_KEY, schema, classImp);
	}
}

export function Field(name?: string | mongoose.SchemaTypeOpts<any>, entitySchemaField?: mongoose.SchemaTypeOpts<any>) {
	return function (target: object, propertyKey: string) {
		Property(target, propertyKey);
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getMetadata(SCHEMA_KEY, classImp);
		schema = ensureEntitySchemaInitiate(schema);
		if (!name) {
			name = propertyKey;
		}
		if (typeof name !== "string") {
			entitySchemaField = name;
			name = propertyKey;
		}
		schema.definition[propertyKey + "::-::" + name] = entitySchemaField;
		defineMetadata(SCHEMA_KEY, schema, classImp);
	}
}

export function getForeignField(target): (ForeignFieldOptions & {name: string})[]{
	let foreignField: (ForeignFieldOptions & {name: string})[] = getMetadata(FOREIGN_KEY, getClass(target)) || [];
	return foreignField;
}

export function ForeignField(options: ForeignFieldOptions);
export function ForeignField(name: string, options: ForeignFieldOptions);
export function ForeignField(arg0: ForeignFieldOptions | string, arg1?: ForeignFieldOptions){
	return function(target: object, propertyKey: string){
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getMetadata(SCHEMA_KEY, classImp);
		schema = ensureEntitySchemaInitiate(schema);
		let name = "";
		let options = null;
		if(typeof arg0 === "string"){
			name = arg0;
			options = arg1;
		}
		else{
			name = propertyKey;
			options = arg0;
		}
		if(options.type === "one-to-one"){
			let entitySchemaField: mongoose.SchemaTypeOpts<any> = {
				type: mongoose.Types.ObjectId,
				ref: options.relatedEntity,
				path: options.refKey
			}
			schema.definition[propertyKey + "::-::" + name] = entitySchemaField;
		}
		else{
			let entitySchemaField = function(schema: mongoose.Schema){
				schema.virtual(name, {
					ref: options.relatedEntity,
					localField: options.localKey,
					foreignField: options.refKey
				});
			}
			schema.virutals.push(entitySchemaField);
		}
		let foreignField: (ForeignFieldOptions & {name: string})[] = getForeignField(target);
		foreignField.push({
			name: name,
			...options
		});
		defineMetadata(SCHEMA_KEY, schema, classImp);
		defineMetadata(FOREIGN_KEY, foreignField, classImp);
	}
}

class FakeSchemaFunction<T> implements IFakeSchemaFunction<T>{
	private middleware: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = new Array();
	pre(method: HookAggregateType, fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookAggregateType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookDocumentType, fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookDocumentType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookModelType, fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookModelType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookQueryType, fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(method: HookQueryType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaFunction<T>;
	pre(
		hook: HookAggregateType | HookDocumentType | HookModelType | HookQueryType,
		arg0: boolean | mongoose.HookSyncCallback<mongoose.Aggregate<any>> | mongoose.HookSyncCallback<mongoose.Document & T> | mongoose.HookSyncCallback<mongoose.Model<mongoose.Document & T, {}>> | mongoose.HookSyncCallback<mongoose.Query<any>>,
		arg1?: mongoose.HookAsyncCallback<mongoose.Aggregate<any>> | mongoose.HookAsyncCallback<mongoose.Document & T> | mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document & T, {}>> | mongoose.HookAsyncCallback<mongoose.Query<any>> | mongoose.HookErrorCallback,
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
				(preFunction as IFakePreModel<T>).type = "preModel";
				this.middleware.push(preFunction as IFakePreModel<T>);
			}
			else if(hook === "init" || hook === "save" || hook === "remove" || hook === "validate"){
				(preFunction as IFakePreDocument<T>).type = "preDocument";
				this.middleware.push(preFunction as IFakePreDocument<T>);
			}
			else{
				(preFunction as IFakePreQuery).type = "preQuery";
				this.middleware.push(preFunction as IFakePreQuery);
			}
			return this;
	}
	plugin(plugin: (schema: mongoose.Schema<any>) => void): IFakeSchemaFunction<T>;
	plugin<U>(plugin: (schema: mongoose.Schema<any>, options: U) => void, opts: U): IFakeSchemaFunction<T>;
	plugin<U = any>(plugin: ((schema: mongoose.Schema<any>) => void) | ((schema: mongoose.Schema<any>, options: U) => void), options?: U): IFakeSchemaFunction<T> {
		let pluginFunction = {
			type: "plugin",
			plugin: plugin,
			options: options
		}
		this.middleware.push(pluginFunction as IFakePlugin);
		return this;
	}
	constructor(_middleware: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = new Array()){
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

export function Entity<T>(options: mongoose.SchemaOptions, tracer: ILogger): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions, tracer: ILogger): (target: any) => void;
export function Entity<T>(options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void, tracer: ILogger): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void, tracer: ILogger): (target: any) => void;
export function Entity<T>(arg0: string | mongoose.SchemaOptions, arg1?: mongoose.SchemaOptions | ((this: IFakeSchemaFunction<T>) => void) | ILogger, arg2?: ((this: IFakeSchemaFunction<T>) => void) | ILogger, arg3?: ILogger): (target: any) => void{
	return function (target: any) {
		let schema: IEntitySchema<T> = getMetadata(SCHEMA_KEY, getClass(target));	
		schema = ensureEntitySchemaInitiate(schema);
		schema.middleware = [];
		let argLength = (arg0 && arg1 && arg2 && arg3) ? 4 : ((arg0 && arg1 && arg2) ? 3 : 2);
		let hook : IFakeSchemaFunction<T> = new FakeSchemaFunction(schema.middleware);
		if(argLength === 4 && typeof arg0 === "string" && isSchemaOptions(arg1) && typeof arg2 === "function" && arg3 instanceof Logger){
			schema.name = arg0;
			schema.schemaOptions = arg1;
			arg2.apply(hook);
			schema.tracer = arg3;
		}
		else if(argLength === 3 && isSchemaOptions(arg0) && typeof arg1 === "function" && arg2 instanceof Logger){
			schema.name = target.name;
			schema.schemaOptions = arg0;
			arg1.apply(hook);
			schema.tracer = arg2;
		}
		else if(argLength === 3 && typeof arg0 === "string" && isSchemaOptions(arg1) && arg2 instanceof Logger){
			schema.name = arg0;
			schema.schemaOptions = arg1;
			schema.tracer = arg2;
		}
		else if(argLength === 2 && isSchemaOptions(arg0) && arg1 instanceof Logger){
			schema.name = target.name;
			schema.schemaOptions = arg0 as mongoose.SchemaOptions;
			schema.tracer = arg1;
		}
		else{
			throw new Error("Something wrong");
		}
		schema.schemaOptions.toObject = {virtuals: true};
		defineMetadata(SCHEMA_KEY, schema, getClass(target));
	}
}