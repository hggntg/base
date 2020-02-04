import {
	IDocumentChange,
	ICollection,
	IBaseEntity,
	IDbContextMetadata,
	IDatabaseContext,
	IDatabaseContextSession,
	IEntitySchema,
	ITrackingOption
} from "@app/interface";
import mongoose from "mongoose";
import { getDbContextMetadata } from "@app/main/database-context/decorator";
import { DBCONTEXT_KEY, SCHEMA_KEY } from "@app/infrastructure/constant";
import { getEntitySchema, Entity, Field, Id, ForeignField } from "@app/main/entity";
import { generateSchema, mapSchemaMiddleware, DbContextSession } from "@app/main/internal";
import { CustomTypes } from "@app/main/types";

export const DATABASE_CONTEXT_SERVICE = "IDatabaseContext";

interface IDatabaseTracking<T extends IBaseEntity> {
	id: mongoose.Types.ObjectId;
	record: mongoose.Types.ObjectId;
	table: string;
	event: "CREATE" | "UPDATE" | "DELETE",
	metadata: string;
	at: Date;
	by: T;
}

// const DatabaseTrackingEvent = ["CREATE", "UPDATE", "DELETE"];
// const ConstDatabaseTrackingEvent = <const>["CREATE", "UPDATE", "DELETE"];
// type TDatabaseTrackingEvent = typeof ConstDatabaseTrackingEvent[number];

// class DatabaseTracking<T extends IBaseEntity> implements IDatabaseTracking<T>{
// 	@Id()
// 	id: mongoose.Types.ObjectId;
// 	@Field({type: mongoose.Types.ObjectId})
// 	record: mongoose.Types.ObjectId;
// 	@Field({type: String})
// 	table: string;
// 	@Field({type: CustomTypes.Select, options: DatabaseTrackingEvent})
// 	event: TDatabaseTrackingEvent;
// 	@Field({type: CustomTypes.Json})
// 	metadata: string;
// 	@Field({type: Date})
// 	at: Date;
// 	@ForeignField({
// 		localKey: "by",
// 		refKey: "id",
// 		relatedEntity: null,
// 		load: "eager",
// 		type: "one-to-one",
// 	})
// 	by: T;
// }

class DatabaseTracker {
	private schema: mongoose.Schema;
	private model: mongoose.Model<mongoose.Document>;
	constructor(_schema: mongoose.Schema){
		this.schema = _schema;
	}
	init(connection: mongoose.Connection){
		this.model = connection.model("BaseDatabaseTracker", this.schema);
	}
	createDoc(doc: mongoose.Document){
		return this.model.create({
			record: doc._id,
			collection: doc.modelName,
			event: "CREATE",
			metdata: JSON.stringify(doc.toObject()),
			at: new Date()
		})
	}
	updateDoc(doc: mongoose.Document){
		return this.model.create({
			record: doc._id,
			collection: doc.modelName,
			event: "UPDATE",
			metdata: JSON.stringify(doc.toObject()),
			at: new Date()
		})
	}
	deleteDoc(doc: mongoose.Document){
		return this.model.create({
			record: doc._id,
			collection: doc.modelName,
			event: "REMOVE",
			metdata: null,
			at: new Date()
		});
	}
}

@Injectable(DATABASE_CONTEXT_SERVICE, true, true)
export class DatabaseContext implements IDatabaseContext {
	private processId: string = "database";
	private processListener: NodeJS.MessageListener;
	list<K, T extends IBaseEntity<K>>(name: string): ICollection<K, T> {
		return this[name];
	}
	saveChanges(): Promise<any> {
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let dbContextSession = this.getDbContextSession();
		let session: mongoose.ClientSession = null;
		let currentId: number = dbContext.context.getCurrentId();
		return dbContextSession.session.then(_session => {
			session = _session;
			session.startTransaction();
			let promiseList = [];
			try {
				let documentLength = dbContextSession.documents.length;
				for (let i = 0; i < documentLength; i++) {
					let change = dbContextSession.documents[i];
					let document = change.document;
					let cmd = null;
					if (change.type === "UPDATE") {
						if (change.data) {
							cmd = new Promise((resolve, reject) => {
								document.updateOne(change.data, (err, raw) => {
									if (err) {
										reject(err);
									}
									else {
										resolve(document);
									}
								});
							})
						}
					}
					else if (change.type === "REMOVE") {
						cmd = document.remove();
					}
					if (!cmd) {
						cmd = document.save();
					}
					promiseList.push(cmd);
				}
				return Promise.all(promiseList).catch(err => {
					if(err.name === 'MongoError'){
						if(err.code === 11000){
							throw new BaseError(409, 11000, "Conflict", "Duplicate document");
						}
						else {
							throw new BaseError(500, err.code, err.name, err.message);
						}
					}
					else{
						throw err;
					}
				});
			}
			catch (e) {
				throw e;
			}
		}).then(() => {
			return session.commitTransaction().then(() => {
				return new Promise((resolve, reject) => {
					session.endSession(function (err, result) {
						dbContext.context.removeById(currentId, "documents");
						dbContext.context.removeById(currentId, "session");
						if (err) {
							reject(err);
						}
						else {
							resolve(result);
						}
					});
				})
			});
		}).catch(err => {
			if (err.message === "Cannot use a session that has ended") {
				dbContext.context.set("session", dbContext.connection.startSession());
				return this.saveChanges();
			}
			else {
				return session.abortTransaction().then(() => {
					return new Promise((resolve, reject) => {
						session.endSession(function (error, result) {
							dbContext.context.removeById(currentId, "documents");
							dbContext.context.removeById(currentId, "session");
							if (error) {
								reject(error);
							}
							else {
								reject(err)
							}
						});
					});
				});
			}
		});
	}
	createConnection(): Promise<boolean> {
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let connectionInfo = dbContext.connectionInfo;
		//To do so how to log it
		mongoose.set("debug", (collection, method, query, docs) => {
			this.logger.pushInfo(`${collection}.${method}(${JSON.stringify(query)}) => ${JSON.stringify(docs)}`, "mongoose");
		});
		this.logger.pushInfo("Ready to connect to database", "database-context");
		return new Promise<boolean>((resolve, reject) => {
			mongoose.createConnection(connectionInfo.uri, connectionInfo.connectionOptions).then(connection => {
				if(!this.processListener){
					this.processListener = (message) => {
						if(message && message.event === "STOP"){
							connection.close().then(() => {
								this.logger.pushInfo("Disconnect to database", "database");
								process.watcher.emit("STOP", this.processId);
							}).catch(e => {
								this.logger.pushError(e, "database");
								process.watcher.emit("STOP", this.processId);
							})
						}
					}
					process.on("message", this.processListener);
				}
				dbContext.connection = connection;
				defineMetadata(DBCONTEXT_KEY, dbContext, getClass(this));
				try {
					Object.values(dbContext.classes).map(entityClass => {
						let schemaEntity: IEntitySchema<typeof entityClass> = getEntitySchema(entityClass);
						schemaEntity = generateSchema(schemaEntity);
						schemaEntity.schema = new mongoose.Schema(schemaEntity.definition, schemaEntity.schemaOptions);
						if (Array.isArray(schemaEntity.virutals)) {
							schemaEntity.virutals.map(virtualFunction => {
								virtualFunction(schemaEntity.schema);
							})
						}
						if (Array.isArray(schemaEntity.middleware)) {
							let middlewareLength = schemaEntity.middleware.length;
							for (let i = 0; i < middlewareLength; i++) {
								let middleware = schemaEntity.middleware[i];
								mapSchemaMiddleware(schemaEntity.schema, middleware);
							}
						}
						if (Array.isArray(schemaEntity.indexes)) {
							schemaEntity.indexes.map(indexFunction => {
								indexFunction(schemaEntity.schema);
							})
						}
						schemaEntity.model = connection.model(schemaEntity.name, schemaEntity.schema);
						
						defineMetadata(SCHEMA_KEY, schemaEntity, getClass(entityClass));
					});
					return resolve(true);
				}
				catch (e) {
					return reject(e);
				}
			});
		});
	}
	enableTracking(option: ITrackingOption): Promise<boolean> {
		let actor = option.actor;
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		// dbContext.tracker = 
		return Promise.resolve(true);
	}
	extend(plugins: Function | Function[]) {
		let dbContext = getDbContextMetadata(this);
		if (!dbContext.connection || dbContext.connection.readyState === 2) {
			if (Array.isArray(plugins)) {
				plugins.map(plugin => {
					mongoose.plugin(plugin);
				});
			}
			else {
				mongoose.plugin(plugins);
			}
		}
	}
	private getDbContextSession(): IDatabaseContextSession {
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let session = dbContext.context.get<Promise<mongoose.ClientSession>>("session");
		if (!session) {
			session = dbContext.connection.startSession();
		}
		let dbContextSession: IDatabaseContextSession = new DbContextSession(session);
		dbContextSession.documents = dbContext.context.get<Array<IDocumentChange>>("documents") || [];
		return dbContextSession;
	}
	protected logger: ILogger
	constructor() {
		this.logger = getDependency<ILogger>(LOGGER_SERVICE);
		process.watcher.joinFrom(this.processId);
	}
}

export * from "@app/main/database-context/decorator";
export * from "@app/main/database-context/collection";