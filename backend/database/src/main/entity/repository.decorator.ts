import { addTryCatchWrapper } from "@base/utilities/dist/add-try-catch-wrapper";
import { BaseEntity } from "./internal";
import { ICollection } from "./database-context.decorator";
import { IBaseRepository } from "@base/interfaces";

export function Repository(target: any){
	Object.keys(target.prototype).map(funcName =>{
		addTryCatchWrapper(target, funcName);
	})
	return target;
}


export class BaseRepositoryImp<T extends BaseEntity> implements IBaseRepository<T>{
	public collection: ICollection<T>;
	constructor(_collection: ICollection<T>){
		this.collection = _collection;
	}
	find(conditions?: any): Promise<T[]> {
		return this.collection.find(conditions);
	}
	findOne(conditions?: any): Promise<T> {
		return this.collection.findOne(conditions);
	}
	findById(_id: string): Promise<T> {
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
	count() {
		return this.collection.count();
	}

	
}