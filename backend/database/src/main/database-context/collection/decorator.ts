import { getDbContextMetadata, DbContextMetadata } from "@app/main/database-context/decorator";
import { DBCONTEXT_KEY, COLLECTION_KEY, UI_KEY } from "@app/infrastructure/constant";
import { IBaseEntity, IDbContextMetadata, ICollectionMetadata, IDatabaseContext, ICollection, IEntityUIList } from "@app/interface";
import { COLLECTION_SERVICE } from "@app/main/database-context/collection";
import { getEntityUIList, getEntityUI } from "@app/main/entity";

export function DCollection<K, T extends IBaseEntity<K>>(classImp: {new() : T}){
	return function(target: object, propertyKey: string){
		Property(classImp);
		let dbContextMetadata: IDbContextMetadata = getDbContextMetadata(target);
		let collectionMetadata: ICollectionMetadata = getCollectionMetadata(classImp);
		let entityUIList: IEntityUIList = getEntityUIList(target);
		if(!dbContextMetadata) dbContextMetadata = new DbContextMetadata();
		if(!collectionMetadata) collectionMetadata = new CollectionMetadata();
		if (!dbContextMetadata.classes) dbContextMetadata.classes = {};
		if(!collectionMetadata.dbContextClass) collectionMetadata.dbContextClass = getClass(target);
		dbContextMetadata.classes[propertyKey] = classImp;

		let entityUI = getEntityUI(getClass(classImp));
		entityUIList.entities[classImp.name] = entityUI;
		defineMetadata(DBCONTEXT_KEY, dbContextMetadata, getClass(target));
		defineMetadata(COLLECTION_KEY, collectionMetadata, getClass(classImp));
		defineMetadata(UI_KEY, entityUIList, getClass(target));

		let isDeleted = delete target[propertyKey];
		if(isDeleted){
			let newVal = getDependency<ICollection<K, T>>(COLLECTION_SERVICE, true);
			newVal.initValue({classImp: classImp});
			let constantName = `Collection<${classImp.name}>`;
			let isExists = checkConstant(COLLECTION_SERVICE, constantName);
			if(!isExists) registerConstant(COLLECTION_SERVICE, newVal, constantName);
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