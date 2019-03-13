import { UnitOfWork, IBaseEntity } from "@base/interfaces";
import { IDatabaseContext } from "./main/database-context";

export interface IExtendDatabase{
	db?: UnitOfWork;
	dbContext?: Object;
	connectDatabase?(entities: {[key: string]: {new() : IBaseEntity}}, context: {new (): IDatabaseContext}, unitOfWork: {new(_context: IDatabaseContext): UnitOfWork}) : Promise<boolean>;
	extendDatabase(plugin);
}