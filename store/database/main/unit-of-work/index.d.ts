import { UnitOfWork, IBaseEntity, IBaseRepository } from "@base/interfaces";
import { IDatabaseContext } from "../database-context";
export declare abstract class AUnitOfWork implements UnitOfWork {
    private readonly dbContext;
    constructor(_dbContext: IDatabaseContext);
    list<T extends IBaseEntity>(name: string): IBaseRepository<T>;
    saveChanges(): Promise<any>;
}
export * from "./decorator";
export * from "./repository";
