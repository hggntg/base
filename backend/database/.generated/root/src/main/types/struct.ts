import mongoose from "mongoose";
import { IEntitySchema } from "@app/interface";
import { getEntitySchema } from "@app/main/entity";

export default class Struct<T> extends mongoose.SchemaType {
    cast(instance: T) {
        return instance;
    }
    constructor(path: string, options?: any) {
        if (options.struct) {
            let schemaEntity: IEntitySchema<T> = getEntitySchema(options.struct);
            options.type = schemaEntity.schema;
            super(path, options, "Struct");
        }
        else {
            throw new Error("Missing struct for schema with custom type");
        }
    }

    static getType(): IClassType {
        return Type.get("Struct", "class") as IClassType;
    }
}