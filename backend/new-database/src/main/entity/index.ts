import mongoose from "mongoose";

export interface IEntityContext {

}

export interface IEntityObject<T = any> {
    set<K>(key: string, value: K);
    get<K>(key: string): K;
    getData(): T;
}

export abstract class EntityObject<T = any> implements IEntityObject<T> {
    protected abstract data: T;
    abstract set<K>(key: string, value: K);
    abstract get<K>(key: string): K;
    abstract getData(): T;
}

export class MongooseEntityObject<T = any> extends EntityObject<T> {
    data: mongoose.Document & T;
    constructor(_data?: mongoose.Document & T) {
        super();
        if (_data) this.data = _data;
        else this.data = new mongoose.Document() as mongoose.Document & T;
    }
    set<K>(key: string, value: K) {
        this.data.set(key, value);
    }
    get<K>(key: string): K {
        return this.data.get(key);
    }
    getData(): T {
        return this.data.toObject() as T;
    }
}