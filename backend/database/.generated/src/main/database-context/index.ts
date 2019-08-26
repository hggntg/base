import {
	IDocumentChange,
	ICollection,
	IBaseEntity,
	IDbContextMetadata,
	IDatabaseContext,
	IDatabaseContextSession,
	IEntitySchema
} from "../../interface";
import mongoose, { Mongoose } from "mongoose";
import { Injectable, getDependency, BaseError } from "@base/class";
import { getDbContextMetadata } from "@app/main/database-context/decorator";
import { DBCONTEXT_KEY, SCHEMA_KEY } from "@app/infrastructure/constant";
import { getEntitySchema } from "@app/main/entity";
import { LOGGER_SERVICE, ILogger } from "@base/logger";
import { generateSchema, mapSchemaMiddleware, DbContextSession } from "@app/main/internal";

export const DATABASE_CONTEXT_SERVICE = "IDatabaseContext";

@Injectable(DATABASE_CONTEXT_SERVICE, true, true)
export class DatabaseContext implements IDatabaseContext {
	list<K, T extends IBaseEntity<K>>(name: string): ICollection<K, T> {
		return this[name];
	}
	saveChanges(): Promise<any> {
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let dbContextSession = this.getDbContextSession();
		let session: mongoose.ClientSession = null;
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
						dbContext.context.remove("documents");
						dbContext.context.remove("session");
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
							dbContext.context.remove("documents");
							dbContext.context.remove("session");
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
	}
}

export * from "./decorator";
export * from "./collection";