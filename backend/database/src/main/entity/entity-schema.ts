import mongoose from "mongoose";
import { Property, getClass, getMetadata } from "@base/class";
import { ensureNew } from "../../infrastructure/utilities";
import { SCHEMA_KEY } from "../../infrastructure/constant";
interface EntitySchemaDefinition {
	[key: string]: mongoose.SchemaTypeOpts<any>
}

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

export function ensureEntitySchemaInitiate(input: EntitySchema) {
	let output = ensureNew<EntitySchema>(EntitySchema, input || new EntitySchema());
	return output;
}

export function getEntitySchema(target: any){
	let classImp = getClass(target);
	let schemaEntity = getMetadata(SCHEMA_KEY, classImp);
	return schemaEntity;
}