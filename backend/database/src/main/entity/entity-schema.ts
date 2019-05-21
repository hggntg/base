import mongoose from "mongoose";
import { Property, getClass, getMetadata } from "@base/class";
import { ensureNew } from "../../infrastructure/utilities";
import { SCHEMA_KEY } from "../../infrastructure/constant";
import { 
	EntitySchemaDefinition,
	IFakePreAggregate, IFakePreModel,
	IFakePreDocument, IFakePreQuery, IFakePlugin,
	IEntitySchema
} from "@base-interfaces/database";
import { ILogger } from "@base-interfaces/logger";

export class EntitySchema<T> implements IEntitySchema<T> {
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

	@Property
	middleware?: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = [];

	@Property
	virutals?: ((schema: mongoose.Schema) => void)[];

	@Property
	tracer: ILogger;

	constructor() {
		this.definition = {};
		this.schemaOptions = {};
		this.virutals = [];
	}
}

export function ensureEntitySchemaInitiate<T>(input: EntitySchema<T>) {
	let output = ensureNew<EntitySchema<T>>(EntitySchema, input || new EntitySchema());
	return output;
}

export function getEntitySchema(target: any){
	let classImp = getClass(target);
	let schemaEntity = getMetadata(SCHEMA_KEY, classImp);
	return schemaEntity;
}