import { HookDocumentType, HookModelType, HookAggregateType, HookQueryType } from "./entity-schema";
import mongoose from "mongoose";
import { IBaseEntity } from "@base/interfaces";
export declare function Id(): (target: object, propertyKey: string) => void;
export declare function Field(name?: string | mongoose.SchemaTypeOpts<any>, entitySchemaField?: mongoose.SchemaTypeOpts<any>): (target: object, propertyKey: string) => void;
export declare function RelatedField(name: string | IBaseEntity, relatedEntity?: IBaseEntity): (target: object, propertyKey: string) => void;
export interface IFakeSchemaPreFunction {
    pre(method: HookAggregateType, fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: HookAggregateType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: HookDocumentType, fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: HookDocumentType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: HookModelType, fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: HookModelType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: HookQueryType, fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: HookQueryType, paralel: boolean, fn: mongoose.HookAsyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
}
export declare function Entity(options: mongoose.SchemaOptions): (target: any) => void;
export declare function Entity(name: string, options: mongoose.SchemaOptions): (target: any) => void;
export declare function Entity(options: mongoose.SchemaOptions, hook: (this: IFakeSchemaPreFunction) => void): (target: any) => void;
export declare function Entity(name: string, options: mongoose.SchemaOptions, hook: (this: IFakeSchemaPreFunction) => void): (target: any) => void;
