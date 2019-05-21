import { getMetadata, getClass, defineMetadata } from "@base/class";
import { UNIT_OF_WORK_KEY } from "../../infrastructure/constant";
import { IUnitOfWorkMetadata } from "@base-interfaces/database";
import { ILogger } from "@base-interfaces/logger";
import { Logger } from "@base/logger";


export function UOW(tracer: ILogger) {
	return function (target: object) {
		let unitOfWork: IUnitOfWorkMetadata = getUnitOfWorkMetadata(getClass(target));
		if(!unitOfWork){
			unitOfWork = {
				classes: {},
				tracer: tracer ? tracer : new Logger("database-uow")
			}
		}
		defineMetadata(UNIT_OF_WORK_KEY, unitOfWork, getClass(target));
	}
}

export function getUnitOfWorkMetadata(target: any) {
	let classImp = getClass(target);
	let unitOfWork: IUnitOfWorkMetadata = getMetadata(UNIT_OF_WORK_KEY, classImp);
	return unitOfWork;
}