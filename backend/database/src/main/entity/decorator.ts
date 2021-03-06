import { SCHEMA_KEY, FOREIGN_KEY, PRE_SCHEMA_KEY, PRE_SCHEMA_LIST, UI_KEY } from "@app/infrastructure/constant";
import {
	IEntitySchema, IFakePreAggregate,
	IFakePreDocument, HookDocumentType, HookModelType, IFakePreModel,
	HookAggregateType, HookQueryType, IFakePreQuery, IFakePlugin, ForeignFieldOptions, IFakeSchemaFunction, TEntityForeignField, IBaseEntity, IEntityUI, IFieldUI, ForeignFieldOptionsWithBrigde
} from "@app/interface";
import { ensureEntitySchemaInitiate, getEntitySchema, getPreEntitySchemaList } from "@app/main/entity/entity-schema";
import mongoose from "mongoose";
import { mapSchemaMiddleware } from "@app/main/internal";
import { BASE_ENTITY_SERVICE } from "@app/main/entity";
import { getEntityUI } from "@app/main/entity/entity-ui";


export function Id() {
	return function (target: object, propertyKey: string) {
		Property(mongoose.Types.ObjectId)(target, propertyKey);
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getEntitySchema(target);
		let entityUI: IEntityUI = getEntityUI(target);
		schema = ensureEntitySchemaInitiate(schema);
		schema.definition[propertyKey + "::-::_id"] = {
			type: mongoose.SchemaTypes.ObjectId,
			auto: true
		}
		if (!entityUI.fields["id"]) {
			entityUI.fields["id"] = {
				disabled: true,
				name: "id",
				type: "input"
			}
		}
		defineMetadata(SCHEMA_KEY, schema, classImp);
		defineMetadata(UI_KEY, entityUI, classImp);
	}
}
export function Field(entitySchemaField: mongoose.SchemaTypeOpts<any>): (target: object, propertyKey: string) => void;
export function Field(entitySchemaField: mongoose.SchemaTypeOpts<any>, ui: IFieldUI): (target: object, propertyKey: string) => void;
export function Field(name: string, entitySchemaField: mongoose.SchemaTypeOpts<any>): (target: object, propertyKey: string) => void;
export function Field(name: string, entitySchemaField: mongoose.SchemaTypeOpts<any>, ui: IFieldUI): (target: object, propertyKey: string) => void;
export function Field(arg0?: string | mongoose.SchemaTypeOpts<any>, arg1?: mongoose.SchemaTypeOpts<any> | IFieldUI, arg2?: IFieldUI) {
	return function (target: object, propertyKey: string) {
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getEntitySchema(classImp);
		let entityUI: IEntityUI = getEntityUI(classImp);
		schema = ensureEntitySchemaInitiate(schema);
		let argLength = ((arg0 && arg1 && arg2) ? 3 : (arg0 && arg1) ? 2 : 1);
		let name, entitySchemaField;
		if (argLength === 3 && typeof arg0 === "string") {
			name = arg0;
			entitySchemaField = arg1;
			if (!entityUI.fields[name]) entityUI.fields[name] = arg2;
		}
		else if (argLength === 2 && typeof arg0 === "string") {
			name = arg0;
			entitySchemaField = arg1;
		}
		else if (argLength === 2) {
			name = propertyKey;
			entitySchemaField = arg0;
			if (!entityUI.fields[name]) entityUI.fields[name] = arg1 as IFieldUI;
		}
		else {
			name = propertyKey;
			entitySchemaField = arg0;
		}
		Property(PropertyTypes.Any)(target, propertyKey);
		// Property(entitySchemaField.type)(target, propertyKey);
		schema.definition[propertyKey + "::-::" + name] = entitySchemaField;

		defineMetadata(SCHEMA_KEY, schema, classImp);
		defineMetadata(UI_KEY, entityUI, classImp);
	}
}

export function getForeignField(target): TEntityForeignField<any>[] {
	let foreignField: TEntityForeignField<any>[] = getMetadata(FOREIGN_KEY, getClass(target)) || [];
	return foreignField;
}

export function ForeignField<T>(options: (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] }));
export function ForeignField<T>(options: (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] }), uiField: IFieldUI);
export function ForeignField<T>(name: string, options: (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] }));
export function ForeignField<T>(name: string, options: (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] }), uiField: IFieldUI);
export function ForeignField<T>(
	arg0: (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] }) | string,
	arg1?: (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] }) | IFieldUI,
	arg2?: IFieldUI) {
	return function (target: object, propertyKey: string) {
		let classImp = getClass(target);
		let schema: IEntitySchema<typeof classImp> = getEntitySchema(classImp);
		let entityUI: IEntityUI = getEntityUI(classImp);
		schema = ensureEntitySchemaInitiate(schema);
		let argLength = ((arg0 && arg1 && arg2) ? 3 : (arg0 && arg1) ? 2 : 1);
		let name;
		let options: (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] });
		if (argLength === 3 && typeof arg0 === "string") {
			name = arg0;
			options = arg1 as (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] });
			if (!entityUI.fields[name]) entityUI.fields[name] = arg2;
		}
		else if (argLength === 2 && typeof arg0 === "string") {
			name = arg0;
			options = arg1 as (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] });
		}
		else if (argLength === 2) {
			name = propertyKey;
			options = arg0 as (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] });
			if (!entityUI.fields[name]) entityUI.fields[name] = arg1 as IFieldUI;
		}
		else {
			name = propertyKey;
			options = arg0 as (ForeignFieldOptions<T> & { hide?: "all" | string[] }) | (ForeignFieldOptionsWithBrigde<T> & { hide?: "all" | string[] });
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
					if (value) {
						if (typeof value === "string" && mongoose.Types.ObjectId(value).equals(value)) this[localField] = value;
						else {
							if (value instanceof mongoose.Types.ObjectId) this[localField] = value.toString();
							else this[localField] = value[refKey];
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
		Property(PropertyTypes.Any)(target, propertyKey);

		let foreignFields: TEntityForeignField<any>[] = getForeignField(target);
		foreignFields.push({
			name: name,
			hide: hide,
			localField: localField,
			...options
		});
		defineMetadata(SCHEMA_KEY, schema, classImp);
		defineMetadata(FOREIGN_KEY, foreignFields, classImp);
		defineMetadata(UI_KEY, entityUI, classImp);
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
		this.indexes.push(function (schema: mongoose.Schema<any>) {
			schema.index(fields);
		});
		return this;
	}
	constructor(_middleware: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = new Array(), _indexes: Array<Function>) {
		this.middleware = _middleware;
		this.indexes = _indexes;
	}
}

function isSchemaOptions(input): input is mongoose.SchemaOptions {
	let isSchemaOption = 1;
	Object.keys(input).map(key => {
		isSchemaOption *= (<mongoose.SchemaOptions>input)[key] !== undefined ? 1 : 0;
	});
	return !!isSchemaOption;
}

function isUIOptions(input): input is IEntityUI {
	let isEntityUI = 1;
	Object.keys(input).map(key => {
		isEntityUI *= (<IEntityUI>input)[key] !== undefined ? 1 : 0;
	});
	return !!isEntityUI;
}

export function PreEntity<T>(name: string): (target: any) => void {
	return function (target: any) {
		let classImp = getClass(target);
		let schema: IEntitySchema<T> = getEntitySchema(target);
		schema = ensureEntitySchemaInitiate(schema);
		schema.name = name;
		let schemaList = getPreEntitySchemaList(global);
		if (!schemaList[classImp.name]) schemaList[classImp.name] = schema;
		defineMetadata(PRE_SCHEMA_LIST, schemaList, global);
	}
}

export function Entity<T>(options: mongoose.SchemaOptions): (target: any) => void;
export function Entity<T>(options: mongoose.SchemaOptions, uiOptions: IEntityUI): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions, uiOptions: IEntityUI): (target: any) => void;
export function Entity<T>(options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Entity<T>(options: mongoose.SchemaOptions, uiOptions: IEntityUI, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Entity<T>(name: string, options: mongoose.SchemaOptions, uiOptions: IEntityUI, hook: (this: IFakeSchemaFunction<T>) => void): (target: any) => void;
export function Entity<T>(arg0: string | mongoose.SchemaOptions, arg1?: mongoose.SchemaOptions | IEntityUI | ((this: IFakeSchemaFunction<T>) => void), arg2?: IEntityUI | ((this: IFakeSchemaFunction<T>) => void), arg3?: ((this: IFakeSchemaFunction<T>) => void)): (target: any) => void {
	return function (target: any) {
		let classImp = getClass(target);
		let schema: IEntitySchema<T> = getEntitySchema(getClass(target));
		let entityUI: IEntityUI = getEntityUI(getClass(target));
		schema = ensureEntitySchemaInitiate(schema);
		schema.middleware = [];
		let argLength = ((arg0 && arg1 && arg2 && arg3) ? 4 : ((arg0 && arg1 && arg2) ? 3 : (arg0 && arg1) ? 2 : 1));
		let hook: IFakeSchemaFunction<T> = new FakeSchemaFunction(schema.middleware, schema.indexes);
		if (argLength === 4 && typeof arg0 === "string" && isSchemaOptions(arg1) && isUIOptions(arg2) && typeof arg3 === "function") {
			schema.name = arg0;
			schema.schemaOptions = arg1;
			arg3.apply(hook);
			entityUI.name = arg2.name;
			entityUI.slug = arg2.slug;
			entityUI.columns = arg2.columns;
		}
		else if (argLength === 3 && typeof arg0 === "string" && isSchemaOptions(arg1) && typeof arg2 === "function") {
			schema.name = arg0;
			schema.schemaOptions = arg1;
			arg2.apply(hook);
		}
		else if (argLength === 3 && isSchemaOptions(arg0) && isUIOptions(arg1) && typeof arg2 === "function") {
			schema.name = classImp.name;
			schema.schemaOptions = arg0;
			arg2.apply(hook);
			entityUI.name = arg1.name;
			entityUI.slug = arg1.slug;
			entityUI.columns = arg1.columns;
		}
		else if (argLength === 3 && typeof arg0 === "string" && isSchemaOptions(arg1) && isUIOptions(arg2)) {
			schema.name = arg0;
			schema.schemaOptions = arg1;
			entityUI.name = arg2.name;
			entityUI.slug = arg2.slug;
			entityUI.columns = arg2.columns;
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
		else if (argLength === 2 && isSchemaOptions(arg0) && isUIOptions(arg1)) {
			schema.name = classImp.name;
			schema.schemaOptions = arg0;
			entityUI.name = arg1.name;
			entityUI.slug = arg1.slug;
			entityUI.columns = arg1.columns;
		}
		else if (argLength === 1 && isSchemaOptions(arg0)) {
			schema.name = classImp.name;
			schema.schemaOptions = arg0;
		}
		else {
			throw new Error("Something wrong");
		}
		let foreignFields: TEntityForeignField<any>[] = getForeignField(target);
		foreignFields = foreignFields.map((foreignField: TEntityForeignField<any>) => {
			if (foreignField.type === "one-to-many") {
				let entitySchemaField;
				if ((<any>foreignField).bridgeEntity) {
					let foreginFieldWithBridge: ForeignFieldOptionsWithBrigde<any> & { name: string, localField: string, hide: "all" | string[] } = foreignField as ForeignFieldOptionsWithBrigde<any> & { name: string, localField: string, hide: "all" | string[] };
					foreginFieldWithBridge.bridgeKey = schema.name + "_" + foreginFieldWithBridge.bridgeKey;
					let localKey = foreginFieldWithBridge.localKey === "id" ? "_id" : foreginFieldWithBridge.localKey;
					let bridgeInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, foreginFieldWithBridge.bridgeEntity.name);
					let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, foreginFieldWithBridge.relatedEntity.name);
					let ref = getEntitySchema(refInstance);
					let bridge = getEntitySchema(bridgeInstance);
					foreginFieldWithBridge.refKey = ref.name + "_" + foreginFieldWithBridge.refKey;
					entitySchemaField = function (schema: mongoose.Schema) {
						schema.virtual(bridge.name + "_" + foreignField.name, {
							ref: bridge.name,
							localField: localKey,
							foreignField: foreginFieldWithBridge.bridgeKey
						});
					}
				}
				else {
					foreignField.refKey = schema.name + "_" + foreignField.refKey;
					let localKey = foreignField.localKey === "id" ? "_id" : foreignField.localKey;
					let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, foreignField.relatedEntity.name);
					let ref = getEntitySchema(refInstance);
					entitySchemaField = function (schema: mongoose.Schema) {
						schema.virtual(foreignField.name, {
							ref: ref.name,
							localField: localKey,
							foreignField: foreignField.refKey
						});
					}
				}
				schema.virutals.push(entitySchemaField);
			}
			return foreignField;
		});
		schema.schemaOptions.toObject = { virtuals: true };
		schema.schemaOptions.toJSON = { virtuals: true };
		schema.schemaOptions.id = false;
		schema.virutals.push(function (schema: mongoose.Schema) {
			schema.virtual("id").get(function () {
				return this._id;
			});
		});
		defineMetadata(SCHEMA_KEY, schema, getClass(target));
		defineMetadata(FOREIGN_KEY, foreignFields, getClass(target));
		defineMetadata(UI_KEY, entityUI, getClass(target));
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
		if (Array.isArray(schema.indexes)) {
			schema.indexes.map(indexFunction => {
				indexFunction(schema.schema);
			});
		}

		defineMetadata(SCHEMA_KEY, schema, getClass(target));
	}
}