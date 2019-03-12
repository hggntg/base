import mongoose from "mongoose";
import { IBaseEntity } from "@base/interfaces";
export declare function Id(): (target: object, propertyKey: string) => void;
export declare function Field(name?: string | mongoose.SchemaTypeOpts<any>, entitySchemaField?: mongoose.SchemaTypeOpts<any>): (target: object, propertyKey: string) => void;
export declare function RelatedField(name: string | IBaseEntity, relatedEntity?: IBaseEntity): (target: object, propertyKey: string) => void;
export declare function Entity(name?: string | mongoose.SchemaOptions, options?: mongoose.SchemaOptions): (target: any) => void;
