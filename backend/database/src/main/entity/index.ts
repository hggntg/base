import mongoose from "mongoose";
import { IEntitySchema, getEntitySchema } from "./entity-schema";
import { IBaseEntity } from "@base/interfaces";

interface IFakeSchemaPreFunction{
	pre(method: "aggregate", fn: mongoose.HookSyncCallback<mongoose.Aggregate<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: "init" | "validate" | "save" | "remove", fn: mongoose.HookSyncCallback<mongoose.Document>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: "insertMany", fn: mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
	pre(method: "count" | "find" | "findOne" | "findOneAndRemove" | "findOneAndUpdate" | "update" | "updateOne" | "updateMany", fn: mongoose.HookSyncCallback<mongoose.Query<any>>, errorCb?: mongoose.HookErrorCallback): IFakeSchemaPreFunction;
}
export abstract class BaseEntity implements IBaseEntity{
	protected abstract initSchema(schema: IFakeSchemaPreFunction);
	public getInstance(): mongoose.Model<mongoose.Document>{
		let entitySchema: IEntitySchema = getEntitySchema(this);
		console.log("=================================entitySchema");
		console.log(entitySchema);
		return entitySchema.model;
	}
	constructor() {

	}
}

export * from "./decorator";
export * from "./entity-schema";