import { IBaseEntity } from "@base/interfaces";
import { ICollection } from "./collection";
export interface IDatabaseContext {
    list<T extends IBaseEntity>(name: string): ICollection<T>;
    saveChanges(): Promise<any>;
}
export declare class DatabaseContext implements IDatabaseContext {
    list<T extends IBaseEntity>(name: string): ICollection<T>;
    saveChanges(): Promise<any>;
    private getDbContextSession;
    constructor();
}
export * from "./decorator";
export * from "./collection";
