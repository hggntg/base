import { App, IBaseEntity, UnitOfWork } from "@base/interfaces";
import { IExtendDatabase } from "./internal";
import { getEntitySchema, IEntitySchema, IFakePreAggregate, IFakePreDocument, IFakePreModel, IFakePreQuery, IFakePlugin, EntitySchema } from "./main/entity";
import { IDatabaseContext } from "./main/database-context";
import mongoose from "mongoose";
import { SCHEMA_KEY, DBCONTEXT_KEY } from "./infrastructure/constant";
import { getClass, defineMetadata, getMetadata } from "@base/class";
import { getDbContextMetadata } from "./main/database-context/decorator";
import { ensureNew } from "./infrastructure/utilities";

declare const app: App & IExtendDatabase;

function getNumberOfArgument(list: Array<any>) {
    let num = 0;
    list.map(l => {
        if (l) {
            num++;
        }
    });
    return num;
}

function mapSchemaMiddleware<T>(schema: mongoose.Schema, middleware: IFakePreAggregate | IFakePreDocument<T> | IFakePreModel<T> | IFakePreQuery | IFakePlugin) {
    if(middleware.type === "plugin"){
        let tempMiddleware = (middleware as IFakePlugin);
        let numOfArgument = getNumberOfArgument([tempMiddleware.plugin, tempMiddleware.options]);
        if(numOfArgument === 1){
            schema.plugin(tempMiddleware.plugin as (schema: mongoose.Schema<any>) => void);
        }
        else{
            schema.plugin(tempMiddleware.plugin, tempMiddleware.options);
        }
    }
    else{
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

function generateSchema<T>(schemaEntity: IEntitySchema<T>): IEntitySchema<T>{
	let realSchema: IEntitySchema<T> = ensureNew(EntitySchema, schemaEntity);
	Object.keys(schemaEntity.definition).map(definitionKey => {
		let keySegments = definitionKey.split("::-::");
		let key = keySegments[1];
		realSchema.definition[key] = realSchema.definition[definitionKey];
		delete realSchema.definition[definitionKey];
	});
	return realSchema;
}

app.connectDatabase = function (entities: { [key: string]: { new(): IBaseEntity } }, context: { new(): IDatabaseContext }, unitOfWork: { new(_context: IDatabaseContext): UnitOfWork }): Promise<boolean> {
    let dbContext = getDbContextMetadata(app.dbContext);
    let connectionInfo = dbContext.connectionInfo;
    return new Promise<boolean>((resolve, reject) => {
        mongoose.createConnection(connectionInfo.uri, connectionInfo.connectionOptions).then(connection => {
            dbContext.connection = connection;
            defineMetadata(DBCONTEXT_KEY, dbContext, getClass(app.dbContext));
            try {
                Object.keys(entities).map(entityKey => {
                    let entityClass = getClass(entities[entityKey]);
                    let schemaEntity: IEntitySchema<typeof entityClass> = getEntitySchema(entities[entityKey]);
                    schemaEntity = generateSchema(schemaEntity);
                    schemaEntity.schema = new mongoose.Schema(schemaEntity.definition);
                    schemaEntity.model = connection.model(schemaEntity.name, schemaEntity.schema);
                    if(Array.isArray(schemaEntity.middleware)){
                        schemaEntity.middleware.map(middleware => {
                            mapSchemaMiddleware(schemaEntity.schema, middleware);
                        });
                    }
                    defineMetadata(SCHEMA_KEY, schemaEntity, getClass(entities[entityKey]));
                });
                let dbContext = new context();
                app.db = new unitOfWork(dbContext);
                resolve(true);
            }
            catch (e) {
                throw new Error(e);
            }
        }).catch(err => {
            reject(err);
        });
    });
}

app.extendDatabase = function (plugins: Function | Array<Function>) {
    let dbContext = getDbContextMetadata(app.dbContext);
    if(!dbContext.connection || dbContext.connection.readyState === 2){
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

export * from "./main/database-context";
export * from "./main/entity";
export * from "./main/repository";
export * from "./main/unit-of-work";
export * from "./internal";