import mongoose from "mongoose";
export declare function Id(): (target: object, propertyKey: string) => void;
export declare function Field(name?: string | mongoose.SchemaTypeOpts<any>, entitySchemaField?: mongoose.SchemaTypeOpts<any>): (target: object, propertyKey: string) => void;
export declare function RelatedField(target: object, propertyKey: string): void;
export declare function Entity(name?: string | mongoose.SchemaOptions, options?: mongoose.SchemaOptions): (target: any) => void;
