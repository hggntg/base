import mongoose from "mongoose";
interface EntitySchemaDefinition {
    [key: string]: mongoose.SchemaTypeOpts<any>;
}
export declare type HookAggregateType = "aggregate";
export declare type HookModelType = "insertMany";
export declare type HookDocumentType = "init" | "validate" | "save" | "remove";
export declare type HookQueryType = "count" | "find" | "findOne" | "findOneAndRemove" | "findOneAndUpdate" | "update" | "updateOne" | "updateMany";
declare type IFakeArg2 = mongoose.HookErrorCallback;
export interface IFakePreAggregate {
    hook: HookAggregateType;
    arg0: mongoose.HookSyncCallback<mongoose.Aggregate<any>> | boolean;
    arg1?: mongoose.HookAsyncCallback<mongoose.Aggregate<any>> | mongoose.HookErrorCallback;
    arg2?: IFakeArg2;
}
export interface IFakePreModel {
    hook: HookModelType;
    arg0: IFakeModelArg0;
    arg1?: IFakeModelArg1;
    arg2?: IFakeArg2;
}
declare type IFakeModelArg0 = mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>> | boolean;
declare type IFakeModelArg1 = mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>> | mongoose.HookErrorCallback;
export interface IFakePreDocument {
    hook: HookDocumentType;
    arg0: IFakeDocumentArg0;
    arg1?: IFakeDocumentArg1;
    arg2?: IFakeArg2;
}
declare type IFakeDocumentArg0 = mongoose.HookSyncCallback<mongoose.Document> | boolean;
declare type IFakeDocumentArg1 = mongoose.HookAsyncCallback<mongoose.Document> | mongoose.HookErrorCallback;
export interface IFakePreQuery {
    hook: HookQueryType;
    arg0: mongoose.HookSyncCallback<mongoose.Query<any>> | boolean;
    arg1?: mongoose.HookAsyncCallback<mongoose.Query<any>> | mongoose.HookErrorCallback;
    arg2?: IFakeArg2;
}
export interface IEntitySchema {
    name: string;
    definition?: EntitySchemaDefinition;
    schemaOptions?: mongoose.SchemaOptions;
    model?: mongoose.Model<mongoose.Document>;
    schema?: mongoose.Schema;
    preFunction?: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery>;
}
export declare class EntitySchema implements IEntitySchema {
    name: string;
    definition?: EntitySchemaDefinition;
    schemaOptions?: mongoose.SchemaOptions;
    model?: mongoose.Model<mongoose.Document, {}>;
    schema?: mongoose.Schema<any>;
    preFunction?: Array<IFakePreAggregate | IFakePreModel | IFakePreDocument | IFakePreQuery>;
    constructor();
}
export declare function ensureEntitySchemaInitiate(input: EntitySchema): EntitySchema;
export declare function getEntitySchema(target: any): any;
export {};
