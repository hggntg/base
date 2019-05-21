import mongoose from "mongoose";
import { getForeignField } from "../../../main/entity";
import { IBaseEntity, ICollection, IDocumentChange } from "@base-interfaces/database";
import { getCollectionMetadata } from "./decorator";
import { getDbContextMetadata } from "../decorator";


function toSinglePromise<T>(fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document>){
	return new Promise<Partial<T>>((resolve, reject) => {
		fn.then(res => {
			let document = res.toObject();
			if(document._id){
				document.id = document._id;
				delete document._id;
			}
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
					let document = r.toObject();
					if(document._id){
						document.id = document._id;
						delete document._id;
					}
					documents.push(document);
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
					if(r._id){
						r.id = r._id;
						delete r._id;
					}
					documents.push(r);
				});
				resolve(documents as Partial<T>[]);
			}).catch(err => {
				reject(err);
			});
		}
	});
}

function removeId(doc){
	let cloneDoc = Object.assign({}, doc);
	cloneDoc._id = cloneDoc.id;
	delete cloneDoc.id;
	return cloneDoc;
}

function createQuery<T>(classImp: {new() : T}, type: "find" | "findOne" | "findById" | "findByIds", input: any ,model: mongoose.Model<mongoose.Document, {}>){
	let foreignFields = getForeignField(classImp);
	let query: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document> | mongoose.DocumentQuery<mongoose.Document, mongoose.Document> = model[type](input);
	foreignFields.map((foreignField) => {
		if(foreignField.type === "one-to-one"){
			if(foreignField.load === "eager"){
				query.populate(foreignField.name);
			}
		}
		else{
			if(foreignField.load === "eager"){
				query.populate(foreignField.name);
			}
		}
	});
	if(type === "find" || type === "findByIds"){
		return query as mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>;
	}
	return query as mongoose.DocumentQuery<mongoose.Document, mongoose.Document>;
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
			return toSinglePromise<T>(this.model.findById(_id));
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
				let document = new model(removeId(doc));
				document.isNew = false;
				this.setChanges("REMOVE", document);
			});
			return docs as Partial<T>[];
		});
	}
	removeById(_id: string) {
		let model = this.model;
		return this.findById(_id).then(doc => {
			let document = new model(removeId(doc));
			document.isNew = false;
			this.setChanges("REMOVE", document);
			return doc as Partial<T>;
		});
	}
	removeMany(_ids: Array<string>) {
		let model = this.model;
		return this.findByIds(_ids).then(docs => {
			docs.map(doc => {
				let document = new model(removeId(doc));
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
				let document = new model(removeId(doc));
				document.isNew = false;
				this.setChanges("UPDATE", document, data);
				let tempDocument = new model(removeId(doc));
				tempDocument.isNew = false;
				tempDocument.set(data);
				let returnDocument = tempDocument.toObject();
				returnDocument.id = returnDocument._id;
				delete returnDocument._id;
				documents.push(returnDocument as Partial<T>);
			});
			return documents;
		});
	}
	updateById(_id: string, data: any) {
		let model = this.model;
		return this.findById(_id).then(doc => {
			let document = new model(removeId(doc));
			document.isNew = false;
			this.setChanges("UPDATE", document, data);
			let tempDocument = new model(removeId(doc));
			tempDocument.isNew = false;
			tempDocument.set(data);
			let returnDocument = tempDocument.toObject();
			returnDocument.id = returnDocument._id;
			delete returnDocument._id;
			return returnDocument as Partial<T>;
		});
	}
	updateMany(_ids: Array<string>, data: any) {
		let model = this.model;
		return this.findByIds(_ids).then(docs => {
			let documents: Partial<T>[] = [];
			docs.map(doc => {
				let document = new model(removeId(doc));
				document.isNew = false;
				this.setChanges("UPDATE", document, data);
				let tempDocument = new model(removeId(doc));
				tempDocument.isNew = false;
				tempDocument.set(data);
				let returnDocument = tempDocument.toObject();
				returnDocument.id = returnDocument._id;
				delete returnDocument._id;
				documents.push(returnDocument as Partial<T>);
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
		let namespace = this.dbContext.context;
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
	get model(){
		return this.entity.getInstance();
	}
	get connection(){
		return this.dbContext.connection;
	}
	get dbContext(){
		let collectionMetadata = getCollectionMetadata(this.classImp);
		let dbContextMetadata = getDbContextMetadata(collectionMetadata.dbContextClass);
		return dbContextMetadata;
	}
	private readonly entity: IBaseEntity;
	private readonly classImp: {new() : T};
	// private dbContext: IDbContextMetadata;
	constructor(_classImp: {new() : T}) {
		// this.dbContext = getDbContextMetadata(collectionMetadata.dbContextClass);
		this.entity = new _classImp();
		// this.connection = this.dbContext.connection;
		this.classImp = _classImp;
	}
}

export * from "./decorator";