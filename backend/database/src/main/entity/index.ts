import mongoose from "mongoose";
import { getEntitySchema } from "./entity-schema";
import { mapData, getClass } from "@base/class";
import { IEntitySchema, IBaseEntity } from "@base-interfaces/database";

export abstract class BaseEntity<T> implements IBaseEntity<T>{
	public getInstance(): mongoose.Model<mongoose.Document & T>{
		let entitySchema: IEntitySchema<this> = getEntitySchema(this);
		return entitySchema.model as mongoose.Model<mongoose.Document & T>;
	}
	constructor();
	constructor(input: Partial<T>);
	constructor(input?: Partial<T>){
		if(input){
			let result = mapData<T>(getClass(this), input);
			Object.keys(result).map(key => {
				this[key] = result[key];
			});
		}
	}
}

export * from "./decorator";
export * from "./entity-schema";