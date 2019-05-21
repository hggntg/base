import { 
	IDocumentChange,
	ICollection,
	IBaseEntity,
	IDbContextMetadata,
	IDatabaseContext,
	IDatabaseContextSession,
	IEntitySchema,
	IFakePreAggregate,
	IFakePreDocument,
	IFakePreModel,
	IFakePreQuery,
	IFakePlugin,
	ICollectionMetadata
} from "@base-interfaces/database";
import mongoose, { Schema } from "mongoose";
import { Collection } from "./collection";
import { getProperties, defineMetadata, getClass } from "@base/class";
import { getDbContextMetadata } from "./decorator";
import { DBCONTEXT_KEY, SCHEMA_KEY } from "../../infrastructure/constant";
import { getEntitySchema, EntitySchema } from "../entity";
import { ensureNew } from "../../infrastructure/utilities";

export class DbContextSession implements IDatabaseContextSession{
	session: Promise<mongoose.ClientSession>;
	documents: Array<IDocumentChange>;
	constructor(_session: Promise<mongoose.ClientSession>, _documents: Array<IDocumentChange> = []){
		this.session = _session;
		this.documents = _documents;
	}
}

function getNumberOfArgument(list: Array<any>) {
    let num = 0;
    list.map(l => {
        if (l) {
            num++;
        }
    });
    return num;
}

function generateSchema<T>(schemaEntity: IEntitySchema<T>): IEntitySchema<T> {
    let realSchema: IEntitySchema<T> = ensureNew(EntitySchema, schemaEntity);
    Object.keys(schemaEntity.definition).map(definitionKey => {
        let keySegments = definitionKey.split("::-::");
        let key = keySegments[1];
        realSchema.definition[key] = realSchema.definition[definitionKey];
        delete realSchema.definition[definitionKey];
    });
    return realSchema;
}

function mapSchemaMiddleware<T>(schema: Schema, middleware: IFakePreAggregate | IFakePreDocument<T> | IFakePreModel<T> | IFakePreQuery | IFakePlugin) {
    if (middleware.type === "plugin") {
        let tempMiddleware = (middleware as IFakePlugin);
        let numOfArgument = getNumberOfArgument([tempMiddleware.plugin, tempMiddleware.options]);
        if (numOfArgument === 1) {
            schema.plugin(tempMiddleware.plugin as (schema: mongoose.Schema<any>) => void);
        }
        else {
            schema.plugin(tempMiddleware.plugin, tempMiddleware.options);
        }
    }
    else {
        let tempMiddleware = (middleware as (IFakePreAggregate | IFakePreDocument<T> | IFakePreModel<T> | IFakePreQuery));
        let numOfArgument = getNumberOfArgument([tempMiddleware.arg0, tempMiddleware.arg1, tempMiddleware.arg2]);
        if (numOfArgument === 1) {
            if (tempMiddleware.type === "preAggregate") {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Aggregate<any>>);
            }
            else if (tempMiddleware.type === "preModel") {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Model<mongoose.Document & T, {}>>);
            }
            else if (tempMiddleware.type === "preDocument") {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Document & T>);
            }
            else {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Query<any>>);
            }
        }
        else if (numOfArgument === 2) {
            if (typeof tempMiddleware.arg0 === "boolean") {
                if (tempMiddleware.type === "preAggregate") {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Aggregate<any>>);
                }
                else if (tempMiddleware.type === "preModel") {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document & T, {}>>);
                }
                else if (tempMiddleware.type === "preDocument") {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Document & T>);
                }
                else {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Query<any>>);
                }
            }
            else {
                if (tempMiddleware.type === "preAggregate") {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Aggregate<any>>, tempMiddleware.arg1 as mongoose.HookErrorCallback);
                }
                else if (tempMiddleware.type === "preModel") {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Model<mongoose.Document & T, {}>>, tempMiddleware.arg1 as mongoose.HookErrorCallback);
                }
                else if (tempMiddleware.type === "preDocument") {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Document & T>, tempMiddleware.arg1 as mongoose.HookErrorCallback);
                }
                else {
                    schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as mongoose.HookSyncCallback<mongoose.Query<any>>, tempMiddleware.arg1 as mongoose.HookErrorCallback);
                }
            }
        }
        else {
            if (tempMiddleware.type === "preAggregate") {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, tempMiddleware.arg2 as mongoose.HookErrorCallback);
            }
            else if (tempMiddleware.type === "preModel") {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document & T, {}>>, tempMiddleware.arg2 as mongoose.HookErrorCallback);
            }
            else if (tempMiddleware.type === "preDocument") {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Document & T>, tempMiddleware.arg2 as mongoose.HookErrorCallback);
            }
            else {
                schema.pre(tempMiddleware.hook, tempMiddleware.arg0 as boolean, tempMiddleware.arg1 as mongoose.HookAsyncCallback<mongoose.Query<any>>, tempMiddleware.arg2 as mongoose.HookErrorCallback);
            }
        }
    }
}


export class DatabaseContext implements IDatabaseContext{
	list<T extends IBaseEntity>(name: string): ICollection<T> {
		return this[name];
	}
	saveChanges(): Promise<any>{
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let dbContextSession = this.getDbContextSession();
		let session: mongoose.ClientSession = null;
		dbContext.context.remove("documents");
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
	createConnection(): Promise<boolean>{
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let connectionInfo = dbContext.connectionInfo;
		if (dbContext.tracer) {
			mongoose.set("debug", (collectionName, method, query, doc) => {
				dbContext.tracer.pushLog({
					level: "debug",
					message: {
						delimiter: " ",
						tag: "DATABASE",
						messages: [
							{
								text: `${collectionName}.${method}(${JSON.stringify(query)})`,
								style:{
									fontColor :{r: 24, g: 255, b: 255},
									underline: true
								}
							},
							{
								text: "=>",
								style: {
									fontColor :{r: 255, g: 87, b: 34}
								}
							},
							{
								text: JSON.stringify(doc),
							}
						]
					}
				});
			});
		}
		return new Promise<boolean>((resolve, reject) => {
			mongoose.createConnection(connectionInfo.uri, connectionInfo.connectionOptions).then(connection => {
				dbContext.connection = connection;
				defineMetadata(DBCONTEXT_KEY, dbContext, getClass(this));
				try{
					Object.values(dbContext.classes).map(entityClass => {
						let schemaEntity: IEntitySchema<typeof entityClass> = getEntitySchema(entityClass);
						schemaEntity = generateSchema(schemaEntity);
						schemaEntity.schema = new mongoose.Schema(schemaEntity.definition, schemaEntity.schemaOptions);
						if(Array.isArray(schemaEntity.virutals)){
							schemaEntity.virutals.map(virtualFunction => {
								virtualFunction(schemaEntity.schema);
							})
						}
						if(Array.isArray(schemaEntity.middleware)){
							let middlewareLength = schemaEntity.middleware.length;
							for(let i = 0; i < middlewareLength; i++){
								let middleware = schemaEntity.middleware[i];
								mapSchemaMiddleware(schemaEntity.schema, middleware);
							}
						}
						schemaEntity.model = connection.model(schemaEntity.name, schemaEntity.schema);
						defineMetadata(SCHEMA_KEY, schemaEntity, getClass(entityClass));
					});
					return resolve(true);
				}
				catch(e){
					return reject(e);
				}
			});
		})
	}
	private getDbContextSession() : IDatabaseContextSession{
		let dbContext: IDbContextMetadata = getDbContextMetadata(this);
		let session = dbContext.context.get<Promise<mongoose.ClientSession>>("session");
		if(!session){
			session = dbContext.connection.startSession();
		}
		let dbContextSession: IDatabaseContextSession = new DbContextSession(session);
		dbContextSession.documents = dbContext.context.get<Array<IDocumentChange>>("documents");
		return dbContextSession;
	}
	constructor(){
		let properties = getProperties(this);
		let dbContext = getDbContextMetadata(this);
		properties.map(property => {
			let classImp = dbContext.classes[property];
			this[property] = new Collection(classImp);
		});
	}
}

export * from "./decorator";
export * from "./collection";