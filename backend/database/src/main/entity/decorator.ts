import { Property, getMetadata, getClass, defineMetadata } from "@base/class";
import { SCHEMA_KEY } from "../../infrastructure/constant";
import { 
	IEntitySchema, ensureEntitySchemaInitiate, IFakePreAggregate,
	IFakePreDocument, HookDocumentType, HookModelType, IFakePreModel,
	HookAggregateType, HookQueryType, IFakePreQuery
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

export interface IFakeSchemaPreFunction{
	pre(method: HookAggregateType, fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookAggregateType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookDocumentType, fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookDocumentType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookModelType, fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookModelType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookQueryType, fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookQueryType, paralel : boolean, fn: mongoose.HookAsyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
}

class FakeSchemaPreFunction implements IFakeSchemaPreFunction{
	private preFunction: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery> = new Array();
	pre(method: HookAggregateType, fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookAggregateType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookDocumentType, fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookDocumentType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookModelType, fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookModelType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookQueryType, fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: HookQueryType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
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
				this.preFunction.push(preFunction as IFakePreAggregate);
			}
			else if(hook === "insertMany"){
				this.preFunction.push(preFunction as IFakePreModel);
			}
			else if(hook === "init" || hook === "save" || hook === "remove" || hook === "validate"){
				this.preFunction.push(preFunction as IFakePreDocument);
			}
			else{
				this.preFunction.push(preFunction as IFakePreQuery);
			}
			return this;
	}
	constructor(_preFunction: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery> = new Array()){
		this.preFunction = _preFunction;
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
export function Entity(options: mongoose.SchemaOptions, hook: (this: IFakeSchemaPreFunction) => void): (target: any) => void;
export function Entity(name: string, options: mongoose.SchemaOptions, hook: (this: IFakeSchemaPreFunction) => void): (target: any) => void;
export function Entity(arg0: string | mongoose.SchemaOptions, arg1?: mongoose.SchemaOptions | ((this: IFakeSchemaPreFunction) => void), arg2?: (this: IFakeSchemaPreFunction) => void): (target: any) => void{
	return function (target: any) {
		let schema: IEntitySchema = getMetadata(SCHEMA_KEY, getClass(target));	
		schema = ensureEntitySchemaInitiate(schema);
		schema.preFunction = [];
		let hook : IFakeSchemaPreFunction = new FakeSchemaPreFunction(schema.preFunction);
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