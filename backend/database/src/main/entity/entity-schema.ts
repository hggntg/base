import mongoose from "mongoose";
import { ensureNew } from "@app/infrastructure/utilities";
import { SCHEMA_KEY, PRE_SCHEMA_LIST } from "@app/infrastructure/constant";
import {
	IEntitySchemaDefinition,
	IFakePreAggregate, IFakePreModel,
	IFakePreDocument, IFakePreQuery, IFakePlugin,
	IEntitySchema
} from "@app/interface";

interface IMongooseSchemaOptions extends mongoose.SchemaOptions {}
@DynamicProperty(PropertyTypes.Any)
class MongooseSchemaOptions implements IMongooseSchemaOptions {
	
}

interface IMongooseSchemaTypeOpts extends mongoose.SchemaTypeOpts<any> {}

@DynamicProperty(PropertyTypes.Any)
class MongooseSchemaTypeOpts implements IMongooseSchemaTypeOpts {}

@DynamicProperty(PropertyTypes.Any)
class EntitySchemaDefinition implements IEntitySchemaDefinition {
	[key: string]: MongooseSchemaTypeOpts;
}

export class EntitySchema<T> implements IEntitySchema<T> {
	@Property(String)
	name: string;

	@Property(EntitySchemaDefinition)
	definition?: IEntitySchemaDefinition;

	@Property(MongooseSchemaOptions)
	schemaOptions?: IMongooseSchemaOptions;

	@Property(PropertyTypes.Any)
	model?: mongoose.Model<mongoose.Document, {}>;

	@Property(PropertyTypes.Any)
	schema?: mongoose.Schema<any>;

	@Property(Array)
	middleware?: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = [];

	@Property(PropertyArray(Function))
	virutals?: ((schema: mongoose.Schema) => void)[];

	@Property(PropertyArray(Function))
	indexes?: ((schema: mongoose.Schema) => void)[];

	constructor() {
		this.definition = {};
		this.schemaOptions = {};
		this.virutals = [];
		this.indexes = [];
	}
}

export function ensureEntitySchemaInitiate<T>(input: EntitySchema<T>) {
	let output = ensureNew<EntitySchema<T>>(EntitySchema, input || new EntitySchema());
	return output;
}

export function getEntitySchema<T>(target: any): IEntitySchema<T> {
	let classImp = getClass(target);
	let schemaEntity = getMetadata<IEntitySchema<T>>(SCHEMA_KEY, classImp);
	if (!schemaEntity) {
		let schemaEntityList = getPreEntitySchemaList<T>(global);
		if (schemaEntityList[classImp.name]) schemaEntity = schemaEntityList[classImp.name];
	}
	return schemaEntity;
}

export interface IEntitySchemaList<T> {
	[key: string]: IEntitySchema<T>
}

export function getPreEntitySchemaList<T>(target: any): IEntitySchemaList<T> {
	let classImp = getClass(target);
	return getMetadata<IEntitySchemaList<T>>(PRE_SCHEMA_LIST, classImp) || {};
}