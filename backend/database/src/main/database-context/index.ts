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
import mongoose, { connection } from "mongoose";
import { getDbContextMetadata } from "@app/main/database-context/decorator";
import { DBCONTEXT_KEY, SCHEMA_KEY } from "@app/infrastructure/constant";
import { getEntitySchema, Entity, Field, Id, ForeignField } from "@app/main/entity";
import { generateSchema, mapSchemaMiddleware, DbContextSession } from "@app/main/internal";
import { CustomTypes } from "@app/main/types";
import { ICache, Cache } from "@app/main/database-context/collection/cache";
import { IEventStore, EVENT_STORE_SERVICE, EventStore, IMetadata } from "../event-store";

export const DATABASE_CONTEXT_SERVICE = "IDatabaseContext";

const cache: ICache = new Cache();

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
	private tracing: boolean;
	trace(tracing: boolean){
		this.logger.trace(tracing);
	}
	list<K, T extends IBaseEntity<K>>(name: string): ICollection<K, T> {
		return this[name];
	}
	saveChanges(): Promise<any> {
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let dbContextSession = this.getDbContextSession();
		let session: mongoose.ClientSession = null;
		let currentId: number = dbContext.context.getCurrentId();
		const eventStore = getDependency<IEventStore>(EVENT_STORE_SERVICE, EventStore.name);
		return dbContextSession.session.then(_session => {
			session = _session;
			session.startTransaction();
			let promiseList = [];
			try {
				let documentLength = dbContextSession.documents.length;
				for (let i = 0; i < documentLength; i++) {
					let change = dbContextSession.documents[i];
					let document = change.document;
					let metadata = dbContextSession.metadatas[i];
					let cmd = null;
					if (change.type === "UPDATE") {
						if (change.data) {
							cmd = new Promise((resolve, reject) => {
								document.updateOne(change.data, (err, raw) => {
									if (err) reject(err);
									else {
										if(dbContext.useEventStore){
											eventStore.write(metadata)
											.then(() => resolve(document))
											.catch(e => reject(e));
										}
										else resolve(document);
									}
								});
							})
						}
					}
					else if (change.type === "REMOVE") {
						if(dbContext.useEventStore){
							cmd = document.remove().then(() => {
								return eventStore.write(metadata);
							});
						}
						else cmd = document.remove();
					}
					if (!cmd) {
						cmd = document.save().then((doc) => {
							if(dbContext.useEventStore) {
								return eventStore.write(metadata).then(() => {
									return doc;
								})
							}
							else return doc;
						});
					}
					promiseList.push(cmd);
				}
				return Promise.all(promiseList).catch(err => {
					if(err.name === 'MongoError'){
						if(err.code === 11000) throw new BaseError(409, 11000, "Duplicate document");
						else throw new BaseError(500, err.code, err.message);
					}
					else throw err;
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
						dbContext.context.removeById(currentId, "metadatas");
						if (err) reject(err);
						else {
							if(dbContext.useCache) cache.clearAll();
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
							dbContext.context.removeById(currentId, "metadatas");
							if (error) reject(error);
							else reject(err);
						});
					});
				});
			}
		});
	}
	createConnection(): Promise<boolean> {
		let logger = getDependency<ILogger>(LOGGER_SERVICE);
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let connectionInfo = dbContext.connectionInfo;
		//To do so how to log it
		mongoose.set("debug", (collection, method, query, docs) => {
			this.logger.pushInfo(`${collection}.${method}(${JSON.stringify(query)}) => ${JSON.stringify(docs)}`, "mongoose");
		});
		logger.pushInfo("Ready to connect to database", "database-context");
		return new Promise<boolean>((resolve, reject) => {
			mongoose.createConnection(connectionInfo.uri, connectionInfo.connectionOptions).then(connection => {
				if(!this.processListener){
					this.processListener = (message) => {
						if(message && message.event === "STOP"){
							connection.close().then(() => {
								logger.pushInfo("Disconnect to database", "database");
								process.watcher.emit("STOP", this.processId);
							}).catch(e => {
								logger.pushError(e, "database");
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
					let collections = [];
					let dbname = connection.db.databaseName;
					Object.values(connection.collections).map((collection) => {
						collections.push(collection.name);
					});
					if(dbContext.useCache){
						return cache.createConnection(dbContext.cacheOptions).then(() => {
							cache.init(dbname, collections).then(() => {
								resolve(true);
							})
						}).catch(e => {
							resolve(true);
						})
					}
					else {
						return resolve(true);
					}
				}
				catch (e) {
					return reject(e);
				}
			});
		}).then(() => {
			if(dbContext.useEventStore){
				let uriSegments = connectionInfo.uri.split("://");
				let hostSegments = uriSegments[1].split("/");
				let querySegments = hostSegments[1].split("?");
				querySegments[0] += "-eventstore";
	
				hostSegments[1] = querySegments.join("?");
				uriSegments[1] = hostSegments.join("/");
				let eventStoreURI = uriSegments.join("://");
				const eventStore = getDependency<IEventStore>(EVENT_STORE_SERVICE, EventStore.name);
				return eventStore.start(eventStoreURI, connectionInfo.connectionOptions).then(() => {
					return true;
				})
			}
			return true;
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
			else mongoose.plugin(plugins);
		}
	}
	private getDbContextSession(): IDatabaseContextSession {
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let session = dbContext.context.get<Promise<mongoose.ClientSession>>("session");
		if (!session) session = dbContext.connection.startSession();
		let dbContextSession: IDatabaseContextSession = new DbContextSession(session);
		dbContextSession.documents = dbContext.context.get<Array<IDocumentChange>>("documents") || [];
		dbContextSession.metadatas = dbContext.context.get<Array<IMetadata>>("metadatas") || [];
		return dbContextSession;
	}
	protected logger: ILogger
	constructor() {
		let logger = getDependency<ILogger>(LOGGER_SERVICE);
		this.logger = logger.expand();
		process.watcher.joinFrom(this.processId);
	}
}

export * from "@app/main/database-context/decorator";
export * from "@app/main/database-context/collection";