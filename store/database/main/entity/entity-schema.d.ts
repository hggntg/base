import mongoose from "mongoose";
interface EntitySchemaDefinition {
    [key: string]: mongoose.SchemaTypeOpts<any>;
}
export interface IEntitySchema {
    name: string;
    definition?: EntitySchemaDefinition;
    schemaOptions?: mongoose.SchemaOptions;
    model?: mongoose.Model<mongoose.Document>;
    schema?: mongoose.Schema;
}
export declare class EntitySchema implements IEntitySchema {
    name: string;
    definition?: EntitySchemaDefinition;
    schemaOptions?: mongoose.SchemaOptions;
    model?: mongoose.Model<mongoose.Document, {}>;
    schema?: mongoose.Schema<any>;
    constructor();
}
export declare function ensureEntitySchemaInitiate(input: EntitySchema): EntitySchema;
export declare function getEntitySchema(target: any): any;
export {};
