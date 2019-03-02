import mongoose = require("mongoose");
import { BaseEntity, extendDatabase } from "./internal";
import { DBCONTEXT_KEY } from "../../shared/constant";
import { getClass, getMetadata, Property, getProperties, defineMetadata } from "@base/class";
import { App } from "@base/interfaces";

/*done*/declare const app: App & extendDatabase;

/*done*/export interface IDbContextProperty {
	connectionInfo: {
		uri: string;
		connectionOptions: mongoose.ConnectionOptions
	};
	connection: mongoose.Connection,
	classes: {
		[key: string]: {new () : BaseEntity}
	}
}

export interface IDbContext {
	list<T extends BaseEntity>(name: string): ICollection<T>;
	saveChanges(): Promise<any>;
}

interface IDbContextSession{
	session: Promise<mongoose.ClientSession>;
	documents: Array<DocumentChange>;
}

class DbContextSessionImp implements IDbContextSession{
	session: Promise<mongoose.ClientSession>;
	documents: Array<DocumentChange>;
	constructor(_session: Promise<mongoose.ClientSession>, _documents: Array<DocumentChange> = []){
		this.session = _session;
		this.documents = _documents;
	}
}

export class DbContextImp implements IDbContext{
	list<T extends BaseEntity>(name: string): ICollection<T> {
		return this[name];
	}
	saveChanges(): Promise<any>{
		let dbContextSession = this.getDbContextSession();
		let session: mongoose.ClientSession = null;
		let namespace = app.context.get("dbContext");
		namespace.remove("documents");
		return dbContextSession.session.then(_session => {
			session = _session;
			session.startTransaction();
			let promiseList = [];
			try{
				let documentLength = dbContextSession.documents.length;
				for(let i = 0; i < documentLength; i++){
					let change = dbContextSession.documents[i];
					let document = change.document;
					if(change.type === "UPDATE"){
						document.update(change.data);
					}
					else{
						document.remove();
					}
					promiseList.push(document.save());
				}
				return Promise.all(promiseList);
			}
			catch(e){
				throw e;
			}
		}).then(() => {
			return session.commitTransaction().then(() => {
				return session.endSession();
			});
		}).catch(err => {
			console.error(err);
			return session.abortTransaction().then(() => {
				return session.endSession();
			});
		});
	}
	private getDbContextSession() : IDbContextSession{
		let dbContext: IDbContextProperty = getDbContext(this);
		let namespace = app.context.get("dbContext");
		let session = namespace.get<Promise<mongoose.ClientSession>>("session");
		if(!session){
			session = dbContext.connection.startSession();
		}
		let dbContextSession: IDbContextSession = new DbContextSessionImp(session);
		dbContextSession.documents = namespace.get<Array<DocumentChange>>("documents");
		return dbContextSession;
	}
	constructor(){
		let properties = getProperties(this);
		let dbContext = getDbContext(app.dbContext);
		properties.map(property => {
			console.log(property);
			let classImp = dbContext.classes[property];
			this[property] = new CollectionImp(classImp);
		});
	}
}

/*done*/export function getDbContext(target: any) : IDbContextProperty{
	let classImp = getClass(target);
	let dbContext = getMetadata(DBCONTEXT_KEY, classImp);
	return dbContext;
}

/*done*/export class DbContextPropertyImp implements IDbContextProperty {
	connectionInfo: { uri: string; connectionOptions: mongoose.ConnectionOptions; };
	connection: mongoose.Connection;
	classes: { [key: string]:  {new () : BaseEntity}; };
	collections: {
		[key: string]: ICollection<BaseEntity>
	}
}

/*done*/export function DBContext(uri: string, connectionOptions: mongoose.ConnectionOptions) {
	return function (target: object) {
		app.dbContext = target;
		let dbContext: IDbContextProperty = getDbContext(target);
		if (!dbContext) {
			dbContext = new DbContextPropertyImp();
		}
		connectionOptions.useNewUrlParser = true;
		dbContext.connectionInfo = {
			uri: uri,
			connectionOptions: connectionOptions
		}
		defineMetadata(DBCONTEXT_KEY, dbContext, getClass(target));
	}
}

/*done*/function toSinglePromise<T>(fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document>){
	return new Promise<mongoose.Document>((resolve, reject) => {
		fn.then(res => {
			resolve(res);
		}).catch(err => {
			reject(err);
		})
	});
}

/*done*/function toListPromise<T>(fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>){
	return new Promise<mongoose.Document[]>((resolve, reject) => {
		fn.then(res => {
			resolve(res);
		}).catch(err => {
			reject(err);
		})
	});
}

/*done*/export interface ICollection<T extends BaseEntity> {
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

/*done*/export class CollectionImp<T extends BaseEntity> implements ICollection<T>{
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
			let documents = namespace.get<DocumentChange[]>("documents") || [];
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
		let dbContext = getDbContext(app.dbContext);
		this.model = new classImp().getInstance();
		this.connection = dbContext.connection;
	}
}

/*done*/export function Collection<T extends BaseEntity>(classImp: {new() : T}) {
	return function(target: object, propertyKey: string){
		Property(target, propertyKey);
		let dbContext: IDbContextProperty = getDbContext(target);
		if(!dbContext){
			dbContext = new DbContextPropertyImp();
		}
		if (!dbContext.classes) {
			dbContext.classes = {};
		}
		dbContext.classes[propertyKey] = classImp;
		defineMetadata(DBCONTEXT_KEY, dbContext, getClass(target));
	}
}

/*done*/export interface DocumentChange {
	type: "REMOVE" | "INSERT" | "UPDATE";
	document: mongoose.Document;
	data?: any;
}