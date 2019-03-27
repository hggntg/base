import { IBaseEntity, App } from "@base/interfaces";
import mongoose, { mongo, MongooseDocument, Mongoose, model } from "mongoose";
import { IExtendDatabase } from "../../../internal";
import { getDbContextMetadata } from "../decorator";

declare const app: App & IExtendDatabase;

function toSinglePromise<T>(fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document>){
	return new Promise<Partial<T>>((resolve, reject) => {
		fn.then(res => {
			let document = res.toObject();
			resolve(document as Partial<T>);
		}).catch(err => {
			reject(err);
		})
	});
}

function toListPromise<T>(type: "query", fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>);
function toListPromise<T>(type: "aggregate", fn: mongoose.Aggregate<any[]>);
function toListPromise<T>(type: "query" | "aggregate", fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document> | mongoose.Aggregate<any[]>){
	return new Promise<Partial<T>[]>((resolve, reject) => {
		if(type === "query"){
			(fn as mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>).then(res => {
				let documents = [];
				res.map(r => {
					documents.push(r.toObject());
				});
				resolve(documents as Partial<T>[]);
			}).catch(err => {
				reject(err);
			});
		}
		else{
			(fn as mongoose.Aggregate<any[]>).then(res => {
				let documents = [];
				res.map(r => {
					documents.push(r.toObject());
				});
				resolve(documents as Partial<T>[]);
			}).catch(err => {
				reject(err);
			});
		}
	});
}

export interface ICollection<T extends IBaseEntity> {
	aggregate(conditions: any[]): Promise<Partial<T>[]>;

	find(conditions: any): Promise<Partial<T>[]>;
	findOne(conditions: any): Promise<Partial<T>>;
	findById(_id: string): Promise<Partial<T>>;
	findByIds(_ids: Array<string>): Promise<Partial<T>[]>;

	insert(doc: Partial<T>): Promise<Partial<T>>;
	insertMany(docs: Array<Partial<T>>): Promise<Partial<T>[]>;

	remove(conditions: any): Promise<Partial<T>[]>;
	removeById(_id: string): Promise<Partial<T>>;
	removeMany(_ids: Array<string>): Promise<Partial<T>[]>;

	update(conditions: any, data: Partial<T>): Promise<Partial<T>[]>;
	updateById(_id: string, data: any): Promise<Partial<T>>;
	updateMany(_ids: Array<string>, data: any): Promise<Partial<T>[]>;

	count();
}

export class Collection<T extends IBaseEntity> implements ICollection<T>{
	aggregate(conditions: any[]): Promise<Partial<T>[]> {
		return toListPromise<T>("aggregate", this.model.aggregate(conditions));
	}
	find(conditions: any = {}) {
		return toListPromise<T>("query", this.model.find(conditions));
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
		return new Promise<Partial<T>>((resolve, reject) => {
			try{
				let model = this.model;
				let document = new model(doc);
				this.setChanges("INSERT", document);
				resolve(document.toObject() as Partial<T>);
			}
			catch(e){
				reject(e);
			}
		});
	}
	insertMany(docs: Array<T>) {
		return new Promise<Partial<T>[]>((resolve, reject) =>{
			try{
				let model = this.model;
				let documents = [];
				docs.map((doc , index)=> {
					let document = new model(doc);
					this.setChanges("INSERT", document);
					documents.push(document.toObject() as Partial<T>);
				});
				resolve(documents as Partial<T>[]);
			}
			catch(e){
				reject(e);
			}
		});
	}
	remove(conditions: any = {}) {
		let model = this.model;
		return this.find(conditions).then(docs => {
			docs.map(doc => {
				let document = new model(doc);
				document.isNew = false;
				this.setChanges("REMOVE", document);
			});
			return docs as Partial<T>[];
		});
	}
	removeById(_id: string) {
		let model = this.model;
		return this.findById(_id).then(doc => {
			let document = new model(doc);
			document.isNew = false;
			this.setChanges("REMOVE", document);
			return doc as Partial<T>;
		});
	}
	removeMany(_ids: Array<string>) {
		let model = this.model;
		return this.findByIds(_ids).then(docs => {
			docs.map(doc => {
				let document = new model(doc);
				document.isNew = false;
				this.setChanges("REMOVE", document);
			});
			return docs as Partial<T>[];
		});
	}
	update(conditions: any, data: any) {
		let model = this.model;
		return this.find(conditions).then(docs => {
			let documents: Partial<T>[] = [];
			docs.map(doc => {
				let document = new model(doc);
				document.isNew = false;
				this.setChanges("UPDATE", document, data);
				let tempDocument = new model(doc);
				tempDocument.isNew = false;
				tempDocument.set(data);
				documents.push(tempDocument.toObject() as Partial<T>);
			});
			return documents;
		});
	}
	updateById(_id: string, data: any) {
		let model = this.model;
		return this.findById(_id).then(doc => {
			let document = new model(doc);
			document.isNew = false;
			this.setChanges("UPDATE", document, data);
			let tempDocument = new model(doc);
			tempDocument.isNew = false;
			tempDocument.set(data);
			return tempDocument.toObject() as Partial<T>;
		});
	}
	updateMany(_ids: Array<string>, data: any) {
		let model = this.model;
		return this.findByIds(_ids).then(docs => {
			let documents: Partial<T>[] = [];
			docs.map(doc => {
				let document = new model(doc);
				document.isNew = false;
				this.setChanges("UPDATE", document, data);
				let tempDocument = new model(doc);
				tempDocument.isNew = false;
				tempDocument.set(data);
				documents.push(tempDocument.toObject() as Partial<T>);
			});
			return documents;
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