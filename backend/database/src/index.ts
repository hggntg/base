import { App, IBaseEntity, UnitOfWork } from "@base/interfaces";
import { IExtendDatabase } from "./internal";
import { getEntitySchema, IEntitySchema } from "./main/entity";
import { IDatabaseContext } from "./main/database-context";
import mongoose from "mongoose";
import { SCHEMA_KEY, DBCONTEXT_KEY } from "./infrastructure/constant";
import { getClass, defineMetadata } from "@base/class";
import { getDbContextMetadata } from "./main/database-context/decorator";

declare const app: App & IExtendDatabase;

app.connectDatabase = function(entities: {[key: string]: {new() : IBaseEntity}}, context: {new (): IDatabaseContext}, unitOfWork: {new(_context: IDatabaseContext): UnitOfWork}): Promise<boolean>{
    let dbContext = getDbContextMetadata(app.dbContext);
    let connectionInfo = dbContext.connectionInfo;
    return new Promise<boolean>((resolve, reject) => {
        mongoose.createConnection(connectionInfo.uri, connectionInfo.connectionOptions).then(connection => {
            dbContext.connection = connection;
            defineMetadata(DBCONTEXT_KEY, dbContext, getClass(app.dbContext));
            try{
                Object.keys(entities).map(entityKey => {
                    let schemaEntity: IEntitySchema = getEntitySchema(entities[entityKey]);
                    schemaEntity.schema = new mongoose.Schema(schemaEntity.definition, schemaEntity.schemaOptions);
                    schemaEntity.model = connection.model(schemaEntity.name, schemaEntity.schema);
                    defineMetadata(SCHEMA_KEY, schemaEntity, getClass(entities[entityKey]));
                });
                let dbContext = new context();
                app.db = new unitOfWork(dbContext);
                resolve(true);
            }
            catch(e){
                throw new Error(e);
            }
        }).catch(err => {
            reject(err);
        });
    });
}

export * from "./main/database-context";
export * from "./main/entity";
export * from "./main/repository";
export * from "./main/unit-of-work";
export * from "./internal";