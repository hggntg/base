import { App, IBaseEntity, UnitOfWork } from "@base/interfaces";
import { IExtendDatabase } from "./internal";
import { getEntitySchema, IEntitySchema, IFakePreAggregate, IFakePreDocument, IFakePreModel, IFakePreQuery, IFakePlugin } from "./main/entity";
import { IDatabaseContext } from "./main/database-context";
import mongoose, { plugin, mongo } from "mongoose";
import { SCHEMA_KEY, DBCONTEXT_KEY } from "./infrastructure/constant";
import { getClass, defineMetadata } from "@base/class";
import { getDbContextMetadata } from "./main/database-context/decorator";

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

function mapSchemaPreHook(schema: mongoose.Schema, preFunction: IFakePreAggregate | IFakePreDocument | IFakePreModel | IFakePreQuery) {
    let numOfArgument = getNumberOfArgument([preFunction.arg0, preFunction.arg1, preFunction.arg2]);
    if (numOfArgument === 1) {
        if (preFunction.hook === "aggregate") {
            schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Aggregate<any>>);
        }
        else if (preFunction.hook === "insertMany") {
            schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>);
        }
        else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
            schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Document>);
        }
        else {
            schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Query<any>>);
        }
    }
    else if (numOfArgument === 2) {
        if (typeof preFunction.arg0 === "boolean") {
            if (preFunction.hook === "aggregate") {
                schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Aggregate<any>>);
            }
            else if (preFunction.hook === "insertMany") {
                schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>);
            }
            else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
                schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Document>);
            }
            else {
                schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Query<any>>);
            }
        }
        else {
            if (preFunction.hook === "aggregate") {
                schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Aggregate<any>>, preFunction.arg1 as mongoose.HookErrorCallback);
            }
            else if (preFunction.hook === "insertMany") {
                schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Model<mongoose.Document, {}>>, preFunction.arg1 as mongoose.HookErrorCallback);
            }
            else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
                schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Document>, preFunction.arg1 as mongoose.HookErrorCallback);
            }
            else {
                schema.pre(preFunction.hook, preFunction.arg0 as mongoose.HookSyncCallback<mongoose.Query<any>>, preFunction.arg1 as mongoose.HookErrorCallback);
            }
        }
    }
    else {
        if (preFunction.hook === "aggregate") {
            schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Aggregate<any>>, preFunction.arg2 as mongoose.HookErrorCallback);
        }
        else if (preFunction.hook === "insertMany") {
            schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Model<mongoose.Document, {}>>, preFunction.arg2 as mongoose.HookErrorCallback);
        }
        else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
            schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Document>, preFunction.arg2 as mongoose.HookErrorCallback);
        }
        else {
            schema.pre(preFunction.hook, preFunction.arg0 as boolean, preFunction.arg1 as mongoose.HookAsyncCallback<mongoose.Query<any>>, preFunction.arg2 as mongoose.HookErrorCallback);
        }
    }
}

function mapSchemaPlugin(schema: mongoose.Schema, plugin: IFakePlugin){
    let numOfArgument = getNumberOfArgument([plugin.plugin, plugin.options]);
    if(numOfArgument === 1){
        schema.plugin(plugin.plugin as ((schema: mongoose.Schema) => void));
    }
    else{
        schema.plugin(plugin.plugin as ((schema: mongoose.Schema, options: any) => void), plugin.options);
    }
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
                    let schemaEntity: IEntitySchema = getEntitySchema(entities[entityKey]);
                    schemaEntity.model = connection.model(schemaEntity.name, schemaEntity.schema);
                    schemaEntity.preFunction.map(preFunction => {
                        mapSchemaPreHook(schemaEntity.schema, preFunction);
                    });
                    schemaEntity.plugins.map(plugin => {
                        mapSchemaPlugin(schemaEntity.schema, plugin);
                    });
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