import { Property, defineMetadata, getClass, getMetadata } from "@base/class";
import { getDbContextMetadata, DbContextMetadata } from "../decorator";
import { DBCONTEXT_KEY, COLLECTION_KEY } from "../../../infrastructure/constant";
import { IBaseEntity, IDbContextMetadata, ICollectionMetadata, IDatabaseContext } from "@base-interfaces/database";
import { ILogger } from "@base-interfaces/logger";
import { Logger } from "@base/logger";

export function DCollection<T extends IBaseEntity>(classImp: {new() : T}, tracer: ILogger){
	return function(target: object, propertyKey: string){
		Property(target, propertyKey);
		let dbContextMetadata: IDbContextMetadata = getDbContextMetadata(target);
		let collectionMetadata: ICollectionMetadata = getCollectionMetadata(classImp);
		if(!dbContextMetadata){
			dbContextMetadata = new DbContextMetadata();
		}
		if(!collectionMetadata){
			collectionMetadata = new CollectionMetadata();
		}
		if (!dbContextMetadata.classes) {
			dbContextMetadata.classes = {};
		}
		if(!collectionMetadata.dbContextClass){
			collectionMetadata.dbContextClass = getClass(target);
		}
		dbContextMetadata.classes[propertyKey] = classImp;
		collectionMetadata.tracer = tracer ? tracer : new Logger("database-collection");
		defineMetadata(DBCONTEXT_KEY, dbContextMetadata, getClass(target));
		defineMetadata(COLLECTION_KEY, collectionMetadata, getClass(classImp));
	}
}

export function getCollectionMetadata(target: any) : ICollectionMetadata{
	let classImp = getClass(target);
	let collectionMetadata = getMetadata(COLLECTION_KEY, classImp);
	return collectionMetadata;
}

export class CollectionMetadata implements ICollectionMetadata{
	dbContextClass: new () => IDatabaseContext;
	tracer: ILogger;
}