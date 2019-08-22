import { getUnitOfWorkMetadata } from "./decorator";
import { getProperties, use, Injectable, getDependency } from "@base/class";
import {
	IDatabaseContext,
	IBaseEntity,
	IBaseRepository,
	IUnitOfWork
} from "../../interface";
import { DATABASE_CONTEXT_SERVICE } from "../database-context";
import { LOGGER_SERVICE, ILogger } from "@base/logger";

export const UNIT_OF_WORK_SERVICE = "IUnitOfWork";

@Injectable(UNIT_OF_WORK_SERVICE, true, true)
export abstract class AUnitOfWork implements IUnitOfWork {
	protected logger: ILogger;
	protected dbContext: IDatabaseContext;
	constructor() {
		this.logger = getDependency<ILogger>(LOGGER_SERVICE);
		let unitOfWorkMetadata = getUnitOfWorkMetadata(this);
		this.dbContext = getDependency<IDatabaseContext>(DATABASE_CONTEXT_SERVICE, unitOfWorkMetadata.databaseContext.name);
	}
	getContext(): IDatabaseContext {
		return this.dbContext;
	}
	list<K, T extends IBaseEntity<K>>(name: string): IBaseRepository<K, T> {
		let firstChar = name[0].toLowerCase();
		let realName = name.replace(name[0], firstChar);
		return this[realName];
	}
	saveChanges() {
		return this.dbContext.saveChanges();
	}
}

export * from "./decorator";
export * from "./repository";
