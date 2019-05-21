import { 
    SCHEMA_KEY, DBCONTEXT_KEY, getEntitySchema, EntitySchema,
    getDbContextMetadata, ensureNew
} from "@base/database";
import { getClass, defineMetadata } from "@base/class";
import { 
    IEntitySchema, IFakePreAggregate, IFakePreDocument, IFakePreModel,
    IFakePreQuery, IFakePlugin, IBaseEntity, IDatabaseContext, UnitOfWork, IExtendDatabase 
} from "@base-interfaces/database";
import { Schema } from "mongoose";

export class ExtendDatabase implements IExtendDatabase{
    db: UnitOfWork;    
    connectDatabase(entities: { [key: string]: new () => IBaseEntity<any>; }, context: new () => IDatabaseContext, unitOfWork: new (_context: IDatabaseContext) => UnitOfWork): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    extendDatabase(plugin: Function | Function[]) {
        throw new Error("Method not implemented.");
    }
    setLogForDatabase(hasLog: boolean) {
        throw new Error("Method not implemented.");
    }


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

app.connectDatabase = function (this: App & IExtendDatabase & IExtendLogger, entities: { [key: string]: { new(): IBaseEntity<any> } }, context: { new(): IDatabaseContext }, unitOfWork: { new(_context: IDatabaseContext): UnitOfWork }): Promise<boolean> {
    let dbContext = getDbContextMetadata(app.dbContext);
    let connectionInfo = dbContext.connectionInfo;
    return new Promise<boolean>((resolve, reject) => {
        mongoose.createConnection(connectionInfo.uri, connectionInfo.connectionOptions).then(connection => {
            dbContext.connection = connection;
            defineMetadata(DBCONTEXT_KEY, dbContext, getClass(app.dbContext));
            try {
                let entityKeys = Object.keys(entities);
                let entityKeyLength = entityKeys.length;
                for(let i = 0; i < entityKeyLength; i++){
                    let entity = entities[entityKeys[i]];
                    let schemaEntity: IEntitySchema<typeof entity> = getEntitySchema(entity);
                    schemaEntity = generateSchema(schemaEntity);
                    schemaEntity.schema = new mongoose.Schema(schemaEntity.definition, schemaEntity.schemaOptions);
                    if(Array.isArray(schemaEntity.virutals)){
                        schemaEntity.virutals.map(virtualFunction => {
                            virtualFunction(schemaEntity.schema);
                        });
                    }
                    if (Array.isArray(schemaEntity.middleware)) {
                        let middlewareLength = schemaEntity.middleware.length;
                        for(let j = 0; j < middlewareLength; j++){
                            let middleware = schemaEntity.middleware[j];
                            mapSchemaMiddleware(schemaEntity.schema, middleware);
                        }
                    }
                    schemaEntity.model = connection.model(schemaEntity.name, schemaEntity.schema);
                    defineMetadata(SCHEMA_KEY, schemaEntity, getClass(entity));
                }
                let dbContext = new context();
                app.db = new unitOfWork(dbContext);
                resolve(true);
            }
            catch (e) {
                throw new Error(e);
            }
        }).catch(err => {
            this.logger.pushLog({
                level: "error",
                message: {
                    tag: "DATABASE",
                    delimiter: " ",
                    messages: [
                        {
                            text: err.stack
                        }
                    ]
                }
            });
            reject(err);
        });
    });
}

app.extendDatabase = function (plugins: Function | Array<Function>) {
    let dbContext = getDbContextMetadata(app.dbContext);
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

app.setLogForDatabase = function (this: App & IExtendDatabase & IExtendLogger, hasLog: boolean) {
    if (hasLog) {
        if (this.logger) {
            mongoose.set("debug", (collectionName, method, query, doc) => {
                this.logger.pushLog({
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
        else {
            throw new Error("Logger is undefined, must defined it on the top of your application");
        }
    }
}