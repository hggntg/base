import { SCHEMA_KEY } from "../../shared/constant";
import { mapData, getMetadata, getClass } from "@base/class";
import { EntitySchema, BaseEntity } from "./entity.decorator";
import { IDbContext, IDbContextProperty } from "./database-context.decorator";
import { IBaseRepository, UnitOfWork } from "@base/interfaces";

export function ensureNew<T>(classImp: {new() : T}, input: T) : T{
	if(typeof input === "object"){
		let output = mapData<T>(classImp, input);
		return output;
	}
	return input as T;
}

export function ensureEntitySchemaInitiate(input: EntitySchema) {
	let output = ensureNew<EntitySchema>(EntitySchema, input || new EntitySchema());
	return output;
}

export function generateSchema(target: any): EntitySchema{
	let schema: EntitySchema = getMetadata(SCHEMA_KEY, getClass(target));
	
	if(!schema){
		schema = getMetadata(SCHEMA_KEY, getClass(target));
		if(!schema){
			return null;
		}
	}
	let realSchema: EntitySchema = ensureNew(EntitySchema, schema);
	Object.keys(schema.definition).map(definitionKey => {
		let keySegments = definitionKey.split("::-::");
		let key = keySegments[1];
		realSchema.definition[key] = realSchema.definition[definitionKey];
		delete realSchema.definition[definitionKey];
	});
	return realSchema;
}

export interface extendDatabase{
	db?: UnitOfWork;
	dbContext?: Object;
}

export {
    BaseEntity,
    EntitySchema,
    IDbContextProperty,
    IDbContext,
    IBaseRepository
}