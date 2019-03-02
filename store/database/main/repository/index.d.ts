import { ICollection } from "../database-context/collection";
import { IBaseEntity, IBaseRepository } from "@base/interfaces";
export declare class BaseRepository<T extends IBaseEntity> implements IBaseRepository<T> {
    collection: ICollection<T>;
    constructor(_collection: ICollection<T>);
    find(conditions?: any): Promise<T[]>;
    findOne(conditions?: any): Promise<T>;
    findById(_id: string): Promise<T>;
    insert(doc: Partial<T>): any;
    insertMany(docs: Array<Partial<T>>): any;
    remove(conditions?: any): any;
    removeById(_id: string): any;
    removeMany(_ids: Array<string>): any;
    update(conditions: any, data: any): any;
    updateById(_id: string, data: any): any;
    updateMany(_ids: Array<string>, data: any): any;
    count(): any;
}
export * from "./decorator";
