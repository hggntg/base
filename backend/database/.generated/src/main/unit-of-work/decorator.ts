import { UNIT_OF_WORK_KEY } from "../../infrastructure/constant";
import { IUnitOfWorkMetadata, IDatabaseContext } from "../../interface";

export function UOW<T extends IDatabaseContext>(databaseContext: { new(): T }) {
	return function (target: object) {
		let unitOfWork: IUnitOfWorkMetadata<T> = getUnitOfWorkMetadata(getClass(target));
		if (!unitOfWork) {
			unitOfWork = {
				databaseContext: null,
				classes: {}
			}
		}
		unitOfWork.databaseContext = databaseContext;
		defineMetadata(UNIT_OF_WORK_KEY, unitOfWork, getClass(target));
	}
}

export function getUnitOfWorkMetadata<T extends IDatabaseContext>(target: any): IUnitOfWorkMetadata<T> {
	let classImp = getClass(target);
	let unitOfWork: IUnitOfWorkMetadata<T> = getMetadata<IUnitOfWorkMetadata<T>>(UNIT_OF_WORK_KEY, classImp);
	return unitOfWork;
}