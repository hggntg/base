import { Property, defineMetadata, getClass } from "@base/class";
import { UNIT_OF_WORK_KEY } from "../../../infrastructure/constant";
import { getUnitOfWorkMetadata } from "../decorator";
import { IUnitOfWorkMetadata, ICollection, IBaseRepository, IBaseEntity } from "@base-interfaces/database";

export function RepositoryProperty<T extends IBaseRepository<IBaseEntity>>(classImp: { new(_collection: ICollection<IBaseEntity>): T }) {
	return function (target: any, propertyKey: string) {
		Property(target, propertyKey);
		let unitOfWork: IUnitOfWorkMetadata = getUnitOfWorkMetadata(getClass(target));
		if(!unitOfWork){
			unitOfWork = {
				classes: {},
				tracer: null
			};
		}
		unitOfWork.classes[propertyKey] = classImp;
		defineMetadata(UNIT_OF_WORK_KEY, unitOfWork, getClass(target));
	}
}