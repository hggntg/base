import { IBaseEntity, App } from "@base/interfaces";
import mongoose from "mongoose";
import { IExtendDatabase } from "../../../internal";
import { getDbContextMetadata } from "../decorator";

declare const app: App & IExtendDatabase;

function toSinglePromise<T>(fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document>){
	return new Promise<mongoose.Document>((resolve, reject) => {
		fn.then(res => {
			resolve(res);
		}).catch(err => {
			reject(err);
		})
	});
}

function toListPromise<T>(fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>){
	return new Promise<mongoose.Document[]>((resolve, reject) => {
		fn.then(res => {
			resolve(res);
		}).catch(err => {
			reject(err);
		})
	});
}

export interface ICollection<T extends IBaseEntity> {
	find(conditions: any);
	findOne(conditions: any);
	findById(_id: string);
	findByIds(_ids: Array<string>);

	insert(doc: Partial<T>);
	insertMany(docs: Array<Partial<T>>);

	remove(conditions: any);
	removeById(_id: string);
	removeMany(_ids: Array<string>);

	update(conditions: any, data: Partial<T>);
	updateById(_id: string, data: any);
	updateMany(_ids: Array<string>, data: any);

	count();
}

export class Collection<T extends IBaseEntity> implements ICollection<T>{
	find(conditions: any = {}) {
		return toListPromise<T>(this.model.find(conditions));
	}
	findOne(conditions: any = {}) {
		return toSinglePromise<T>(this.model.findOne(conditions));
	}
	findById(_id: string) {
		if(this.validObjectId([_id])){
			return toSinglePromise<T>(this.model.findById(mongoose.Types.ObjectId(_id)));
		}
		else{
			throw new Error("_id is not an ObjectId");
		}
	}
	findByIds(_ids: Array<string>){
		if(this.validObjectId(_ids)){
			let conditions: {
				_id: {
					$in: Array<mongoose.Types.ObjectId>
				}
			} = {
				_id: {
					$in: new Array()
				}
			};
			_ids.map(_id => {
				conditions._id.$in.push(mongoose.Types.ObjectId(_id));
			});
			return this.find(conditions);
		}
		else{
			throw new Error("_id is not an ObjectId");
		}
	}
	insert(doc: Partial<T>) {
		let model = this.model;
		let document = new model(doc);
		this.setChanges("INSERT", document);
	}
	insertMany(docs: Array<T>) {
		let model = this.model;
		docs.map(doc => {
			let document = new model(doc);
			this.setChanges("INSERT", document);
		});
	}
	remove(conditions: any = {}) {
		this.find(conditions).then(docs => {
			docs.map(doc => {
				this.setChanges("REMOVE", doc);
			});
		})
	}
	removeById(_id: string) {
		this.findById(_id).then(doc => {
			this.setChanges("REMOVE", doc);
		});
	}
	removeMany(_ids: Array<string>) {
		this.findByIds(_ids).then(docs => {
			docs.map(doc => {
				this.setChanges("REMOVE", doc);
			});
		});
	}
	update(conditions: any, data: any) {
		this.find(conditions).then(docs => {
			docs.map(doc => {
				this.setChanges("UPDATE", doc, data);
			});
		});
	}
	updateById(_id: string, data: any) {
		this.findById(_id).then(doc => {
			this.setChanges("UPDATE", doc, data);
		});
	}
	updateMany(_ids: Array<string>, data: any) {
		this.findByIds(_ids).then(docs => {
			docs.map(doc => {
				this.setChanges("UPDATE", doc, data);
			});
		});
	}
	count() {
		return this.model.countDocuments();
	}
	private validObjectId(_ids: Array<string>){
		let isValid = 1;
		_ids.map(_id => {
			if(mongoose.Types.ObjectId.isValid(_id)){
				isValid *= 1;
			}
			else{
				isValid *= 0;
			}
		})
		return isValid ? true : false;
	}
	private setChanges(type: "REMOVE" | "INSERT" | "UPDATE" , document: mongoose.Document, data?: any) {
		let namespace = app.context.get("dbContext");
		if (namespace) {
			let session = namespace.get<Promise<mongoose.ClientSession>>("session");
			if (!session) {
				session = this.connection.startSession();
				namespace.set("session", session);
			}
			let documents = namespace.get<IDocumentChange[]>("documents") || [];
			documents.push({type: type, document: document, data: data});
			namespace.set("documents", documents);
		}
		else{
			throw new Error("DbContext change detector not exists");
		}
	}
	private readonly model: mongoose.Model<mongoose.Document>;
	private readonly connection: mongoose.Connection;
	constructor(classImp: {new() : T}) {
		let dbContext = getDbContextMetadata(app.dbContext);
		let _model = (new classImp()).getInstance();
		this.model = _model;
		this.connection = dbContext.connection;
	}
}
export interface IDocumentChange {
	type: "REMOVE" | "INSERT" | "UPDATE";
	document: mongoose.Document;
	data?: any;
}

export * from "./decorator";