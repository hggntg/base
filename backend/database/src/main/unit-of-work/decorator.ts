import { getMetadata, getClass } from "@base/class";
import { UNIT_OF_WORK_KEY } from "../../infrastructure/constant";
import { ICollection } from "../database-context/collection";
import { IBaseEntity, IBaseRepository } from "@base/interfaces";

export interface IUnitOfWorkMetadata {
	classes: { 
		[key: string]: { new(_collection: ICollection<IBaseEntity>): IBaseRepository<IBaseEntity> }
	};
}

export function getUnitOfWorkMetadata(target: any) {
	let classImp = getClass(target);
	let unitOfWork: IUnitOfWorkMetadata = getMetadata(UNIT_OF_WORK_KEY, classImp);
	return unitOfWork;
}