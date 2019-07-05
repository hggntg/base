export interface IWherable<T> {
    where(conditions: any): IWherable<T>;
    find(): IRestCommandable<T> & ISelectable<T>;
	findOne(): IRestCommandable<T> & ISelectable<T>;
}

export interface ILimitable<T> extends IWherable<T> {
	limit?<K extends ILimitable<T>>(this: K, about: number): Omit<K, "limit">;
}

export interface ISkipable<T> extends IWherable<T>{
	skip?<K extends ISkipable<T>>(this: K, about: number): Omit<K, "skip">;
}

export interface ISortable<T> extends IWherable<T> {
	sort?<K extends ISortable<T>>(this: K, conditions: any): Omit<K, "sort">;
}

export interface ISelectable<T>{
    then(onfulfilled?: (value: T) => T | void | PromiseLike<T | void>, onrejected?: (reason: any) => PromiseLike<never>): Promise<T | void>;
    select?<K extends ISelectable<T>>(this: K, what?: string): Pick<K, "then">;
}

export interface IQueryable<T> extends ILimitable<T>, ISkipable<T>, ISortable<T>{

}

export interface IInsertable<T> {
    insert(document: T): void;
    insertMany(documents: T[]): void;
}

export interface IRestCommandable<T> {
	update(data: T);
    remove();
}

interface IUser{
    name: string;
    age: number;
    location: string;
}

export interface ICollection<T> extends IQueryable<T>, IInsertable<T>{

}

export interface ICollecctionRestCommand<T> extends IRestCommandable<T>, ISelectable<T>{}

export class CollectionRestCommand<T> implements ICollecctionRestCommand<T> {
    update(data: T) {
        throw new Error("Method not implemented.");
    }
    remove() {
        throw new Error("Method not implemented.");
    }
    select?<K extends ICollecctionRestCommand<T>>(what?: string): Pick<K, "then"> {
        return this as any;
    }
    then(onfulfilled?: (value: T) => void | T | PromiseLike<void | T>, onrejected?: (reason: any) => PromiseLike<never>): Promise<void | T> {
        throw new Error("Method not implemented.");
    }
}

export class Collection<T> implements ICollection<T> {
    command: ICollecctionRestCommand<T>;
    where(conditions: any): IWherable<T> {
        return this;
    }
    find(): ICollecctionRestCommand<T> {
        throw new Error("Method not implemented.");
    }
    findOne(): ICollecctionRestCommand<T> {
        throw new Error("Method not implemented.");
    }
    limit<K extends IQueryable<T>>(about: number): Pick<K, Exclude<keyof K, "limit">> {
        return this as any;
    }
    skip<K extends IQueryable<T>>(about: number): Pick<K, Exclude<keyof K, "skip">> {
        return this as any;
    }
    sort<K extends IQueryable<T>>(conditions: any): Pick<K, Exclude<keyof K, "sort">> {
        return this as any;
    }
    insert(document: T): void {
        throw new Error("Method not implemented.");
    }
    insertMany(documents: T[]): void {
        throw new Error("Method not implemented.");
    }
    constructor(){
        this.command = new CollectionRestCommand();
    }
}

let a: Collection<IUser> = new Collection();
a.find().remove();