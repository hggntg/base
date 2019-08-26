import { Property, getDependency, checkConstant, registerConstant } from "@base/class";
import { getDbContextMetadata, DbContextMetadata } from "@app/main/database-context/decorator";
import { DBCONTEXT_KEY, COLLECTION_KEY } from "@app/infrastructure/constant";
import { IBaseEntity, IDbContextMetadata, ICollectionMetadata, IDatabaseContext, ICollection } from "@app/interface";
import { ILogger } from "@base/logger";
import { COLLECTION_SERVICE } from ".";

export function DCollection<K, T extends IBaseEntity<K>>(classImp: {new() : T}){
	return function(target: object, propertyKey: string){
		Property(Object);
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
		defineMetadata(DBCONTEXT_KEY, dbContextMetadata, getClass(target));
		defineMetadata(COLLECTION_KEY, collectionMetadata, getClass(classImp));

		let isDeleted = delete target[propertyKey];
		if(isDeleted){
			let newVal = getDependency<ICollection<K, T>>(COLLECTION_SERVICE, true);
			newVal.initValue({classImp: classImp});
			let constantName = `Collection<${classImp.name}>`;
			let isExists = checkConstant(COLLECTION_SERVICE, constantName);
			if(!isExists){
				registerConstant(COLLECTION_SERVICE, newVal, constantName);
			}
			Object.defineProperty(target, propertyKey, {
				configurable: true,
				enumerable: true,
				get(){
					return newVal;
				},
				set(_val: ICollection<K, T>){
					newVal = _val;
				}
			});
		}
	}
}

export function getCollectionMetadata(target: any) : ICollectionMetadata{
	let classImp = getClass(target);
	let collectionMetadata = getMetadata<ICollectionMetadata>(COLLECTION_KEY, classImp);
	return collectionMetadata;
}

export class CollectionMetadata implements ICollectionMetadata{
	dbContextClass: new () => IDatabaseContext;
	tracer: ILogger;
}