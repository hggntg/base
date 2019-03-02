import { IBaseEntity } from "@base/interfaces";
import mongoose from "mongoose";
export interface ICollection<T extends IBaseEntity> {
    find(conditions: any): any;
    findOne(conditions: any): any;
    findById(_id: string): any;
    findByIds(_ids: Array<string>): any;
    insert(doc: Partial<T>): any;
    insertMany(docs: Array<Partial<T>>): any;
    remove(conditions: any): any;
    removeById(_id: string): any;
    removeMany(_ids: Array<string>): any;
    update(conditions: any, data: Partial<T>): any;
    updateById(_id: string, data: any): any;
    updateMany(_ids: Array<string>, data: any): any;
    count(): any;
}
export declare class Collection<T extends IBaseEntity> implements ICollection<T> {
    find(conditions?: any): Promise<mongoose.Document[]>;
    findOne(conditions?: any): Promise<mongoose.Document>;
    findById(_id: string): Promise<mongoose.Document>;
    findByIds(_ids: Array<string>): Promise<mongoose.Document[]>;
    insert(doc: Partial<T>): void;
    insertMany(docs: Array<T>): void;
    remove(conditions?: any): void;
    removeById(_id: string): void;
    removeMany(_ids: Array<string>): void;
    update(conditions: any, data: any): void;
    updateById(_id: string, data: any): void;
    updateMany(_ids: Array<string>, data: any): void;
    count(): mongoose.Query<number>;
    private validObjectId;
    private setChanges;
    private readonly model;
    private readonly connection;
    constructor(classImp: {
        new (): T;
    });
}
export interface IDocumentChange {
    type: "REMOVE" | "INSERT" | "UPDATE";
    document: mongoose.Document;
    data?: any;
}
export * from "./decorator";
