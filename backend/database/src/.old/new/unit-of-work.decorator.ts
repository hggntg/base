import { IDbContext, IBaseRepository, BaseEntity, extendDatabase } from "./internal";
import { UNIT_OF_WORK_KEY } from "../../shared/constant";
import { getClass, getMetadata, Property, getProperties, defineMetadata } from "@base/class";
import { BaseRepositoryImp } from "./repository.decorator";
import { ICollection } from "./database-context.decorator";
import { IBaseEntity, UnitOfWork, App } from "@base/interfaces";

declare const app: App & extendDatabase;

interface UnitOfWorkProperty {
	classes: { 
		[key: string]: { new(_collection: ICollection<BaseEntity>): IBaseRepository<BaseEntity> }
	};
}

function getUnitOfWork(target: any) {
	let classImp = getClass(target);
	let unitOfWork: UnitOfWorkProperty = getMetadata(UNIT_OF_WORK_KEY, classImp);
	return unitOfWork;
}

export abstract class UnitOfWorkAbs implements UnitOfWork {
	private readonly dbContext: IDbContext;
	constructor(_dbContext: IDbContext) {
		this.dbContext = _dbContext;
		let unitOfWork: UnitOfWorkProperty = getUnitOfWork(this);
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

export function RepositoryProperty<T extends BaseRepositoryImp<BaseEntity>>(classImp: { new(_collection: ICollection<BaseEntity>): T }) {
	return function (target: any, propertyKey: string) {
		Property(target, propertyKey);
		let unitOfWork: UnitOfWorkProperty = getMetadata(UNIT_OF_WORK_KEY, getClass(target));
		if(!unitOfWork){
			unitOfWork = {
				classes: {}
			};
		}
		unitOfWork.classes[propertyKey] = classImp;
		defineMetadata(UNIT_OF_WORK_KEY, unitOfWork, getClass(target));
	}
}