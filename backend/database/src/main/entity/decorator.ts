import { Property, getMetadata, getClass, defineMetadata } from "@base/class";
import { SCHEMA_KEY } from "../../infrastructure/constant";
import { IEntitySchema, ensureEntitySchemaInitiate } from "./entity-schema";
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