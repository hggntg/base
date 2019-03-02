import mongoose = require("mongoose");
import { Property, getClass, getMetadata, defineMetadata } from "@base/class";
import { SCHEMA_KEY } from "../../shared/constant";
import { ensureEntitySchemaInitiate } from "./internal";
import { IBaseEntity } from '@base/interfaces';

export interface IEntitySchema {
	name: string;
	definition?: EntitySchemaDefinition;
	schemaOptions?: mongoose.SchemaOptions;
	model?: mongoose.Model<mongoose.Document>;
	schema?: mongoose.Schema;
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

	constructor() {
		this.definition = {};
		this.schemaOptions = {};
	}
}

interface EntitySchemaDefinition {
	[key: string]: mongoose.SchemaTypeOpts<any>
}

interface fakeSchemaPreFunction{
	pre(method: "aggregate", fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): fakeSchemaPreFunction;
	pre(method: "init" | "validate" | "save" | "remove", fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): fakeSchemaPreFunction;
	pre(method: "insertMany", fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): fakeSchemaPreFunction;
	pre(method: "count" | "find" | "findOne" | "findOneAndRemove" | "findOneAndUpdate" | "update" | "updateOne" | "updateMany", fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): fakeSchemaPreFunction;
}
export abstract class BaseEntity implements IBaseEntity{
	protected abstract initSchema(schema: fakeSchemaPreFunction);
	public getInstance(): mongoose.Model<mongoose.Document>{
		let entitySchema: IEntitySchema = getEntitySchema(this);
		return entitySchema.model;
	}
	constructor() {

	}
}

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
export function RelatedField(target: object, propertyKey: string) {

}

export function Entity(name?: string | mongoose.SchemaOptions, options?: mongoose.SchemaOptions) {
	return function (target: any) {
		let schema: IEntitySchema = getMetadata(SCHEMA_KEY, getClass(target));
		schema = ensureEntitySchemaInitiate(schema);
		if (!name) {
			name = target.name;
		}
		if (typeof name !== "string") {
			options = name;
			name = target.name;
		}
		schema.name = name as string;
		schema.schemaOptions = options;
		defineMetadata(SCHEMA_KEY, schema, getClass(target));
	}
}

export function getEntitySchema(target: any){
	let classImp = getClass(target);
	let schemaEntity = getMetadata(SCHEMA_KEY, classImp);
	return schemaEntity;
}