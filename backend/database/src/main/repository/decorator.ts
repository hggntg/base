import { IBaseEntity, IRepositoryMetadata, IEntityUI } from "@app/interface";
import { REPOSITORY_KEY, UI_KEY } from "@app/infrastructure/constant";
import { getEntityUI } from "../entity";

export function Repository<K, T extends IBaseEntity<K>>(entity: { new(): T }): (target: any) => any {
	return function (target: any) {
		let repositoryMetadata = getRepositoryMetadata<K, T>(target);
		if (!repositoryMetadata) {
			repositoryMetadata = {
				entity: null
			}
		}
		repositoryMetadata.entity = entity;
		let entityUI: IEntityUI = getEntityUI(getClass(entity));
		defineMetadata(UI_KEY, entityUI, target);
		defineMetadata(REPOSITORY_KEY, repositoryMetadata, target);
	}
}

export function getRepositoryMetadata<K, T extends IBaseEntity<K>>(target): IRepositoryMetadata<K, T> {
	let classImp = getClass(target);
	return getMetadata<IRepositoryMetadata<K, T>>(REPOSITORY_KEY, classImp);
}