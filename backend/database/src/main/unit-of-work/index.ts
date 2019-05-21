import { getUnitOfWorkMetadata } from "./decorator";
import { getProperties } from "@base/class";
import {
	IUnitOfWorkMetadata,
	IDatabaseContext,
	UnitOfWork,
	IBaseEntity,
	IBaseRepository 
} from "@base-interfaces/database";


export abstract class AUnitOfWork implements UnitOfWork {
	private readonly dbContext: IDatabaseContext;
	constructor(_dbContext: IDatabaseContext) {
		this.dbContext = _dbContext;
		let unitOfWork: IUnitOfWorkMetadata = getUnitOfWorkMetadata(this);
		let properties = getProperties(this);
		properties.map(property => {
			let classImp = unitOfWork.classes[property];
			this[property] = new classImp(_dbContext.list(property));
		});
	}
	list<T extends IBaseEntity>(name: string): IBaseRepository<T> {
		let realName = name.toLowerCase();
		return this[realName];
	}
	saveChanges() {
		return this.dbContext.saveChanges();
	}
}

export * from "./decorator";
export * from "./repository";
	