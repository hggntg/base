import mongoose from "mongoose";
import { Property } from "@base/class";
import { ensureNew } from "../../infrastructure/utilities";
import { SCHEMA_KEY } from "../../infrastructure/constant";
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

	constructor() {
		this.definition = {};
		this.schemaOptions = {};
		this.virutals = [];
	}

    static getType(): IClassType {
        return Type.get("EntitySchema", "class") as IClassType;
    }
}

export function ensureEntitySchemaInitiate<T>(input: EntitySchema<T>) {
	let output = ensureNew<EntitySchema<T>>(EntitySchema, input || new EntitySchema());
	return output;
}

export function getEntitySchema<T>(target: any): IEntitySchema<T>{
	let classImp = getClass(target);
	let schemaEntity = getMetadata<IEntitySchema<T>>(SCHEMA_KEY, classImp);
	return schemaEntity;
}