import { UNIT_OF_WORK_KEY, UI_KEY } from "@app/infrastructure/constant";
import { getUnitOfWorkMetadata } from "@app/main/unit-of-work/decorator";
import { IUnitOfWorkMetadata, IBaseRepository, IBaseEntity, IUnitOfWorkUI, IEntityUI } from "@app/interface";
import { BASE_REPOSITORY_SERVICE } from "@app/main/repository";
import { getUnitOfWorkUI } from "@app/main/entity";

export function RepositoryProperty<K, T extends IBaseRepository<K, IBaseEntity<K>>>(classImp: { new(): T }) {
	return function (target: any, propertyKey: string) {
		Property(Object)(target, propertyKey);
		let unitOfWork: IUnitOfWorkMetadata<any> = getUnitOfWorkMetadata(getClass(target));
		let unitOfWorkUI: IUnitOfWorkUI = getUnitOfWorkUI(getClass(target));
		if(!unitOfWork){
			unitOfWork = {
				databaseContext: null,
				classes: {}
			};
		}
		unitOfWork.classes[propertyKey] = classImp;
		defineMetadata(UNIT_OF_WORK_KEY, unitOfWork, getClass(target));
		let isDeleted = delete target[propertyKey];
		if(isDeleted){
			Object.defineProperty(target, propertyKey, {
				configurable: true,
				enumerable: true,
				get(){
					let unitOfWork = getMetadata<IUnitOfWorkMetadata<any>>(UNIT_OF_WORK_KEY, getClass(this));
					return getDependency<T>(BASE_REPOSITORY_SERVICE, unitOfWork.classes[propertyKey].name);
				}
			});
		}
		let entityUI: IEntityUI = getMetadata<IEntityUI>(UI_KEY, getClass(classImp));
		if(entityUI.slug){
			unitOfWorkUI.repositories[entityUI.slug] = propertyKey;
			defineMetadata(UI_KEY, unitOfWorkUI, getClass(target));
		}
	}
}