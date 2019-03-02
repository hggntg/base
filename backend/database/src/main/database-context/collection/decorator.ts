import { IBaseEntity } from "@base/interfaces";
import { Property, defineMetadata, getClass } from "@base/class";
import { IDbContextMetadata, getDbContextMetadata, DbContextMetadata } from "../decorator";
import { DBCONTEXT_KEY } from "../../../infrastructure/constant";

export function DCollection<T extends IBaseEntity>(classImp: {new() : T}) {
	return function(target: object, propertyKey: string){
		Property(target, propertyKey);
		let dbContext: IDbContextMetadata = getDbContextMetadata(target);
		if(!dbContext){
			dbContext = new DbContextMetadata();
		}
		if (!dbContext.classes) {
			dbContext.classes = {};
		}
		dbContext.classes[propertyKey] = classImp;
		defineMetadata(DBCONTEXT_KEY, dbContext, getClass(target));
	}
}