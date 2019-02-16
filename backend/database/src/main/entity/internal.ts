import { SCHEMA_KEY } from "../../shared/constant";
import { mapData } from "@base/class";
import { EntitySchema, EntitySchemaImp, BaseEntity } from "./entity.decorator";
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
	let output = ensureNew<EntitySchema>(EntitySchemaImp, input || new EntitySchemaImp());
	return output;
}

export function generateSchema(target: any): EntitySchema{
	let schema: EntitySchema = Reflect.getMetadata(SCHEMA_KEY, target.constructor);
	
	if(!schema){
		schema = Reflect.getMetadata(SCHEMA_KEY, target);
		if(!schema){
			return null;
		}
	}
	let realSchema: EntitySchema = ensureNew(EntitySchemaImp, schema);
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
    EntitySchemaImp,
    IDbContextProperty,
    IDbContext,
    IBaseRepository
}