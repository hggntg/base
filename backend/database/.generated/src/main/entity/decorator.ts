import { Property, getDependency } from "@base/class";
import { SCHEMA_KEY, FOREIGN_KEY, PRE_SCHEMA_KEY, PRE_SCHEMA_LIST } from "../../infrastructure/constant";
import {
	IEntitySchema, IFakePreAggregate,
	IFakePreDocument, HookDocumentType, HookModelType, IFakePreModel,
	HookAggregateType, HookQueryType, IFakePreQuery, IFakePlugin, ForeignFieldOptions, IFakeSchemaFunction, TEntityForeignField, IBaseEntity
} from "../../interface";
import { ensureEntitySchemaInitiate, getEntitySchema, getPreEntitySchemaList } from "./entity-schema";
import mongoose from "mongoose";
import { mapSchemaMiddleware } from "../internal";
import { BASE_ENTITY_SERVICE } from ".";


export function Id() {
	return function (target: object, propertyKey: string) {
		Property(mongoose.Types.ObjectId)(target, propertyKey);
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getEntitySchema(target);
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
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getEntitySchema(classImp);
		schema = ensureEntitySchemaInitiate(schema);
		if (!name) {
			name = propertyKey;
		}
		if (typeof name !== "string") {
			entitySchemaField = name;
			name = propertyKey;
		}
		Property(entitySchemaField.type)(target, propertyKey);
		schema.definition[propertyKey + "::-::" + name] = entitySchemaField;
		defineMetadata(SCHEMA_KEY, schema, classImp);
	}
}

export function getForeignField(target): TEntityForeignField<any>[] {
	let foreignField: TEntityForeignField<any>[] = getMetadata(FOREIGN_KEY, getClass(target)) || [];
	return foreignField;
}

export function ForeignField<T>(options: ForeignFieldOptions<T> & { hide?: "all" | string[] });
export function ForeignField<T>(name: string, options: ForeignFieldOptions<T> & { hide?: "all" | string[] });
export function ForeignField<T>(arg0: ForeignFieldOptions<T> & { hide?: "all" | string[] } | string, arg1?: ForeignFieldOptions<T> & { hide?: "all" | string[] }) {
	return function (target: object, propertyKey: string) {
		Property(Object)(target, propertyKey);
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getEntitySchema(classImp);
		schema = ensureEntitySchemaInitiate(schema);
		let name = "";
		let options: ForeignFieldOptions<T> & { hide?: "all" | string[] } = null;
		if (typeof arg0 === "string") {
			name = arg0;
			options = arg1;
		}
		else {
			name = propertyKey;
			options = arg0;
		}
		let localField = "";
		let hide = options.hide || [];
		if (options.type === "one-to-one") {
			let entitySchemaField: mongoose.SchemaTypeOpts<any> = {
				type: mongoose.Types.ObjectId,
				ref: options.relatedEntity,
				path: options.refKey
			}
			let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, options.relatedEntity.name);
			let ref = getEntitySchema(refInstance);

			localField = ref.name + "_" + name;
			schema.definition[propertyKey + "::-::" + localField] = entitySchemaField;
			let refKey = options.refKey === "id" ? "_id" : options.refKey;
			let entitySchemaVirtualField = function (schema: mongoose.Schema) {
				schema.virtual(name, {
					ref: ref.name,
					localField: localField,
					foreignField: refKey,
					justOne: true
				}).set(function (value) {
					if(value){
						if(typeof value === "string" && mongoose.Types.ObjectId(value).equals(value)){
							this[localField] = value;
						}
						else{
							if(value instanceof mongoose.Types.ObjectId){
								this[localField] = value.toString();
							}
							else {
								this[localField] = value[refKey];
							}
						}
					}
					return value;
				});
			}
			schema.virutals.push(entitySchemaVirtualField);
		}
		else {
			localField = options.localKey;
		}
		let foreignFields: TEntityForeignField<any>[] = getForeignField(target);
		foreignFields.push({
			name: name,
			hide: hide,
			localField: localField,
			...options
		});
		defineMetadata(SCHEMA_KEY, schema, classImp);
		defineMetadata(FOREIGN_KEY, foreignFields, classImp);
	}
}
class FakeSchemaFunction<T> implements IFakeSchemaFunction<T>{
	private middleware: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = new Array();
	private indexes: Array<Function>;
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
		if (hook === "aggregate") {
			(preFunction as IFakePreAggregate).type = "preAggregate";
			this.middleware.push(preFunction as IFakePreAggregate);
		}
		else if (hook === "insertMany") {
			(preFunction as IFakePreModel<T>).type = "preModel";
			this.middleware.push(preFunction as IFakePreModel<T>);
		}
		else if (hook === "init" || hook === "save" || hook === "remove" || hook === "validate") {
			(preFunction as IFakePreDocument<T>).type = "preDocument";
			this.middleware.push(preFunction as IFakePreDocument<T>);
		}
		else {
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
	index(fields: { [key in keyof T]: 1 | -1; }): IFakeSchemaFunction<T> {
		this.indexes.push(function(schema: mongoose.Schema<any>){
			schema.index(fields);
		});
		return this;
	}
	constructor(_middleware: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = new Array(), _indexes: Array<Function>) {
		this.middleware = _middleware;
		this.indexes = _indexes;
	}

    static getType(): IClassType {
        return Type.get("FakeSchemaFunction", "class") as IClassType;
    }
}

function isSchemaOptions(input): input is mongoose.SchemaOptions {
	let isSchemaOption = 1;
	Object.keys(input).map(key => {
		isSchemaOption *= (<mongoose.SchemaOptions>input)[key] !== undefined ? 1 : 0;
	});
	return !!isSchemaOption;
}

export function PreEntity<T>(name: string): (target: any) => void{
	return function (target: any) {
		let classImp = getClass(target);
		let schema: IEntitySchema<T> = getEntitySchema(target);
		schema = ensureEntitySchemaInitiate(schema);
		schema.name = name;
		let schemaList = getPreEntitySchemaList(global);
		if(!schemaList[classImp.name]) schemaList[classImp.name] = schema;
		defineMetadata(PRE_SCHEMA_LIST, schemaList, global);
	}
}

export function Entity<T>(options: mongoose.SchemaOptions): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions): (target: any) => void;
export function Entity<T>(options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Entity<T>(arg0: string | mongoose.SchemaOptions, arg1?: mongoose.SchemaOptions | ((this: IFakeSchemaFunction<T>) => void), arg2?: ((this: IFakeSchemaFunction<T>) => void)): (target: any) => void {
	return function (target: any) {
		let classImp = getClass(target);
		let schema: IEntitySchema<T> = getEntitySchema(getClass(target));
		schema = ensureEntitySchemaInitiate(schema);
		schema.middleware = [];
		let argLength = ((arg0 && arg1 && arg2) ? 3 : (arg0 && arg1) ? 2 : 1);
		let hook: IFakeSchemaFunction<T> = new FakeSchemaFunction(schema.middleware, schema.indexes);
		if (argLength === 3 && typeof arg0 === "string" && isSchemaOptions(arg1) && typeof arg2 === "function") {
			schema.name = arg0;
			schema.schemaOptions = arg1;
			arg2.apply(hook);
		}
		else if (argLength === 2 && isSchemaOptions(arg0) && typeof arg1 === "function") {
			schema.name = classImp.name;
			schema.schemaOptions = arg0;
			arg1.apply(hook);
		}
		else if (argLength === 2 && typeof arg0 === "string" && isSchemaOptions(arg1)) {
			schema.name = arg0;
			schema.schemaOptions = arg1;
		}
		else if(argLength === 1 && isSchemaOptions(arg0)){
			schema.name = classImp.name;
			schema.schemaOptions = arg0;
		}
		else {
			throw new Error("Something wrong");
		}
		let foreignFields: TEntityForeignField<any>[] = getForeignField(target);
		foreignFields = foreignFields.map(foreignField => {
			if(foreignField.type === "one-to-many"){
				foreignField.refKey = schema.name + "_" + foreignField.refKey;
				let localKey = foreignField.localKey === "id" ? "_id" : foreignField.localKey;
				let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, foreignField.relatedEntity.name);
				let ref = getEntitySchema(refInstance);
				let entitySchemaField = function (schema: mongoose.Schema) {
					schema.virtual(foreignField.name, {
						ref: ref.name,
						localField: localKey,
						foreignField: foreignField.refKey
					});
				}
				schema.virutals.push(entitySchemaField);
			}
			return foreignField;
		});
		schema.schemaOptions.toObject = { virtuals: true };
		schema.schemaOptions.toJSON = { virtuals: true };
		defineMetadata(SCHEMA_KEY, schema, getClass(target));
		defineMetadata(FOREIGN_KEY, foreignFields, getClass(target));
	}
}

export function Struct<T>(options: mongoose.SchemaOptions): (target: any) => void;
export function Struct<T>(name: string, options: mongoose.SchemaOptions): (target: any) => void;
export function Struct<T>(options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Struct<T>(name: string, options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Struct<T>(arg0: string | mongoose.SchemaOptions, arg1?: mongoose.SchemaOptions | ((this: IFakeSchemaFunction<T>) => void), arg2?: ((this: IFakeSchemaFunction<T>) => void)): (target: any) => void {
	return function (target: any) {
		let classImp = getClass(target);
		let schema: IEntitySchema<T> = getEntitySchema(getClass(target));
		schema = ensureEntitySchemaInitiate(schema);
		schema.middleware = [];
		schema.indexes = [];
		let argLength = ((arg0 && arg1 && arg2) ? 3 : (arg0 && arg1) ? 2 : 1);
		let hook: IFakeSchemaFunction<T> = new FakeSchemaFunction(schema.middleware, schema.indexes);
		if (argLength === 3 && typeof arg0 === "string" && isSchemaOptions(arg1) && typeof arg2 === "function") {
			schema.name = arg0;
			schema.schemaOptions = arg1;
			arg2.apply(hook);
		}
		else if (argLength === 2 && isSchemaOptions(arg0) && typeof arg1 === "function") {
			schema.name = classImp.name;
			schema.schemaOptions = arg0;
			arg1.apply(hook);
		}
		else if (argLength === 2 && typeof arg0 === "string" && isSchemaOptions(arg1)) {
			schema.name = arg0;
			schema.schemaOptions = arg1;
		}
		else {
			throw new Error("Something wrong");
		}
		schema.schemaOptions.toObject = { virtuals: true };

		schema.schema = new mongoose.Schema(schema.definition, schema.schemaOptions);
		if (Array.isArray(schema.virutals)) {
			schema.virutals.map(virtualFunction => {
				virtualFunction(schema.schema);
			})
		}
		if (Array.isArray(schema.middleware)) {
			let middlewareLength = schema.middleware.length;
			for (let i = 0; i < middlewareLength; i++) {
				let middleware = schema.middleware[i];
				mapSchemaMiddleware(schema.schema, middleware);
			}
		}
		if (Array.isArray(schema.indexes)){
			schema.indexes.map(indexFunction => {
				indexFunction(schema.schema);
			});
		}

		defineMetadata(SCHEMA_KEY, schema, getClass(target));
	}
}