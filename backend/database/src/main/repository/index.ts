import { ICollection } from "../database-context/collection";
import { IBaseEntity, IBaseRepository } from "@base/interfaces";

export class BaseRepository<T extends IBaseEntity> implements IBaseRepository<T>{
	public collection: ICollection<T>;
	constructor(_collection: ICollection<T>){
		this.collection = _collection;
	}
	aggregate(conditions: any[]): Promise<Partial<T>[]> {
		return this.collection.aggregate(conditions);
	}
	find(conditions?: any): Promise<Partial<T>[]> {
		return this.collection.find(conditions);
	}
	findOne(conditions?: any): Promise<Partial<T>> {
		return this.collection.findOne(conditions);
	}
	findById(_id: string): Promise<Partial<T>> {
		return this.collection.findById(_id);
	}
	insert(doc: Partial<T>) {
		return this.collection.insert(doc);
	}
	insertMany(docs: Array<Partial<T>>) {
		return this.collection.insertMany(docs);
	}
	remove(conditions?: any) {
		return this.collection.remove(conditions);
	}
	removeById(_id: string) {
		return this.collection.removeById(_id);
	}
	removeMany(_ids: Array<string>) {
		return this.collection.removeMany(_ids);
	}
	update(conditions: any, data: any) {
		return this.collection.update(conditions, data);
	}
	updateById(_id: string, data: any) {
		return this.collection.updateById(_id, data);
	}
	updateMany(_ids: Array<string>, data: any) {
		return this.collection.updateMany(_ids, data);
	}
	count(): Promise<T> {
		return this.collection.count();
	}	
}

export * from "./decorator";