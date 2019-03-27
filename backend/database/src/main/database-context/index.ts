import { IBaseEntity, App } from "@base/interfaces";
import mongoose from "mongoose";
import { IDocumentChange, ICollection, Collection } from "./collection";
import { IExtendDatabase } from "../../internal";
import { getProperties } from "@base/class";
import { getDbContextMetadata, IDbContextMetadata } from "./decorator";

declare const app: App & IExtendDatabase;

export interface IDatabaseContext {
	list<T extends IBaseEntity>(name: string): ICollection<T>;
	saveChanges(): Promise<any>;
}

interface IDatabaseContextSession{
	session: Promise<mongoose.ClientSession>;
	documents: Array<IDocumentChange>;
}

class DbContextSession implements IDatabaseContextSession{
	session: Promise<mongoose.ClientSession>;
	documents: Array<IDocumentChange>;
	constructor(_session: Promise<mongoose.ClientSession>, _documents: Array<IDocumentChange> = []){
		this.session = _session;
		this.documents = _documents;
	}
}

export class DatabaseContext implements IDatabaseContext{
	list<T extends IBaseEntity>(name: string): ICollection<T> {
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
					let cmd = null;
					if(change.type === "UPDATE"){
						cmd = document.update(change.data);
					}
					else if(change.type === "REMOVE"){
						cmd = document.remove();
					}
					if(!cmd){
						cmd = document.save();
					}
					promiseList.push(cmd);
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
	private getDbContextSession() : IDatabaseContextSession{
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let namespace = app.context.get("dbContext");
		let session = namespace.get<Promise<mongoose.ClientSession>>("session");
		if(!session){
			session = dbContext.connection.startSession();
		}
		let dbContextSession: IDatabaseContextSession = new DbContextSession(session);
		dbContextSession.documents = namespace.get<Array<IDocumentChange>>("documents");
		return dbContextSession;
	}
	constructor(){
		let properties = getProperties(this);
		let dbContext = getDbContextMetadata(app.dbContext);
		properties.map(property => {
			let classImp = dbContext.classes[property];
			this[property] = new Collection(classImp);
		});
	}
}

export * from "./decorator";
export * from "./collection";