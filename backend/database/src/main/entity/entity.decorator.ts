import mongoose = require("mongoose");
import { Property } from "@base/class";
import { SCHEMA_KEY, DBCONTEXT_KEY } from "../../shared/constant";
import { ensureEntitySchemaInitiate, IDbContextProperty, generateSchema } from "./internal";
import { App, IBaseEntity } from '@base/interfaces';
import { extendDatabase } from './internal';

declare const app: App & extendDatabase;

export interface EntitySchema {
	name: string,
	definition?: EntitySchemaDefinition,
	schemaOptions?: mongoose.SchemaOptions
}

export class EntitySchemaImp implements EntitySchema {
	@Property
	name: string;

	@Property
	definition?: EntitySchemaDefinition;

	@Property
	schemaOptions?: mongoose.SchemaOptions;

	constructor() {
		this.definition = {};
		this.schemaOptions = {};
	}
}

interface EntitySchemaDefinition {
	[key: string]: mongoose.SchemaTypeOpts<any>
}

export abstract class BaseEntity implements IBaseEntity{
	protected schema: mongoose.Schema;
	protected model: mongoose.Model<mongoose.Document>;
	protected abstract initSchema();
	public getInstance(): mongoose.Model<mongoose.Document>{
		return this.model;
	}
	constructor() {
		let dbContext: IDbContextProperty = Reflect.getMetadata(DBCONTEXT_KEY, app.dbContext.constructor);
		let schema: EntitySchema = generateSchema(this);
		if(!app.db || !app.db.list(schema.name.toLowerCase())){
			this.schema = new mongoose.Schema(schema.definition, schema.schemaOptions);
			this.model = dbContext.connection.model(schema.name, this.schema);
			this.initSchema();
		}
	}
}

export function Id() {
	return function (target: object, propertyKey: string) {
		Property(target, propertyKey);
		let schema: EntitySchema = Reflect.getMetadata(SCHEMA_KEY, target.constructor);
		schema = ensureEntitySchemaInitiate(schema);
		schema.definition[propertyKey + "::-::_id"] = {
			type: mongoose.SchemaTypes.ObjectId,
			auto: true
		}
		Reflect.defineMetadata(SCHEMA_KEY, schema, target.constructor);
	}
}

export function Field(name?: string | mongoose.SchemaTypeOpts<any>, entitySchemaField?: mongoose.SchemaTypeOpts<any>) {
	return function (target: object, propertyKey: string) {
		Property(target, propertyKey);
		let schema: EntitySchema = Reflect.getMetadata(SCHEMA_KEY, target.constructor);
		schema = ensureEntitySchemaInitiate(schema);
		if (!name) {
			name = propertyKey;
		}
		if (typeof name !== "string") {
			entitySchemaField = name;
			name = propertyKey;
		}
		schema.definition[propertyKey + "::-::" + name] = entitySchemaField;
		Reflect.defineMetadata(SCHEMA_KEY, schema, target.constructor);
	}
}
export function RelatedField(target: object, propertyKey: string) {

}

export function Entity(name?: string | mongoose.SchemaOptions, options?: mongoose.SchemaOptions) {
	return function (target: any) {
		let schema: EntitySchema = Reflect.getMetadata(SCHEMA_KEY, target);
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
		Reflect.defineMetadata(SCHEMA_KEY, schema, target);
	}
}