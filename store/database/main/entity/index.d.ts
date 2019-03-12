import mongoose from "mongoose";
import { IBaseEntity } from "@base/interfaces";
export interface IFakeSchemaPreFunction {
    pre(method: "aggregate", fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: "init" | "validate" | "save" | "remove", fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: "insertMany", fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
    pre(method: "count" | "find" | "findOne" | "findOneAndRemove" | "findOneAndUpdate" | "update" | "updateOne" | "updateMany", fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
}
export declare abstract class BaseEntity implements IBaseEntity {
    protected abstract initSchema(schema: IFakeSchemaPreFunction): any;
    getInstance(): mongoose.Model<mongoose.Document>;
    constructor();
}
export * from "./decorator";
export * from "./entity-schema";
