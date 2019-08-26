import mongoose from "mongoose";
import { getEntitySchema } from "@app/main/entity/entity-schema";
import { mapData, Injectable } from "@base/class";
import { IEntitySchema, IBaseEntity } from "@app/interface";

export const BASE_ENTITY_SERVICE = "IBaseEntity";

@Injectable(BASE_ENTITY_SERVICE, true, true)
export class BaseEntity<T> implements IBaseEntity<T>{
	getType(): IClassType {
        return Type.get("BaseEntity", "class") as IClassType;
    }
	public getInstance(): mongoose.Model<mongoose.Document & T>{
		let classImp = getClass(this);
		let entitySchema: IEntitySchema<typeof classImp> = getEntitySchema<typeof classImp>(classImp);
		return entitySchema.model as mongoose.Model<mongoose.Document & T>;
	}
	constructor(){
		
	}
	initValue(input: Partial<T>){
		if(input){
			let result = mapData<T>(getClass(this), input);
			Object.keys(result).map(key => {
				this[key] = result[key];
			});
		}
	}

    static getType(): IClassType {
        return Type.get("BaseEntity", "class") as IClassType;
    }
}

export * from "./decorator";
export * from "./entity-schema";