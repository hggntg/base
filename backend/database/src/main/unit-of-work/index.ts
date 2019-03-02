import { UnitOfWork, IBaseEntity, IBaseRepository, App } from "@base/interfaces";
import { IDatabaseContext } from "../database-context";
import { IUnitOfWorkMetadata, getUnitOfWorkMetadata } from "./decorator";
import { getProperties } from "@base/class";
import { IExtendDatabase } from "../../internal";

declare const app: App & IExtendDatabase;

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
		app.db = this;
	}
	list<T extends IBaseEntity>(name: string): IBaseRepository<T> {
		return this[name];
	}
	saveChanges() {
		return this.dbContext.saveChanges();
	}
}

export * from "./decorator";
export * from "./repository";
