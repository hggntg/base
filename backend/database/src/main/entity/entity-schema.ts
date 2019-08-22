import mongoose from "mongoose";
import { Property } from "@base/class";
import { ensureNew } from "../../infrastructure/utilities";
import { SCHEMA_KEY, PRE_SCHEMA_KEY, PRE_SCHEMA_LIST } from "../../infrastructure/constant";
import {
	EntitySchemaDefinition,
	IFakePreAggregate, IFakePreModel,
	IFakePreDocument, IFakePreQuery, IFakePlugin,
	IEntitySchema
} from "../../interface";

export class EntitySchema<T> implements IEntitySchema<T> {
	@Property(String)
	name: string;

	@Property(Object)
	definition?: EntitySchemaDefinition;

	@Property(Object)
	schemaOptions?: mongoose.SchemaOptions;

	@Property(Object)
	model?: mongoose.Model<mongoose.Document, {}>;

	@Property(Object)
	schema?: mongoose.Schema<any>;

	@Property(Array)
	middleware?: Array<IFakePreAggregate | IFakePreModel<T> | IFakePreDocument<T> | IFakePreQuery | IFakePlugin> = [];

	@Property(Function)
	virutals?: ((schema: mongoose.Schema) => void)[];

	@Property(Function)
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