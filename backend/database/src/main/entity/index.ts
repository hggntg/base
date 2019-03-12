import mongoose from "mongoose";
import { IEntitySchema, getEntitySchema } from "./entity-schema";
import { IBaseEntity } from "@base/interfaces";

export abstract class BaseEntity implements IBaseEntity{
	public getInstance(): mongoose.Model<mongoose.Document>{
		let entitySchema: IEntitySchema = getEntitySchema(this);
		return entitySchema.model;
	}
	constructor() {
		
	}
}

export * from "./decorator";
export * from "./entity-schema";