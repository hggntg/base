import mongoose from "mongoose";
import { IDatabaseConfig, IMongooseConfig } from "@app/infrastructure/database-config";

export interface IDatabaseConnection<T = any> {
    conn: T;
    createConnection(config: IDatabaseConfig<any>): Promise<void>;
    close(): Promise<void>;
}

export abstract class DatabaseConnection<T = any> implements IDatabaseConnection<T> {
    protected _conn: T;
    get conn(): T {
        return this._conn;
    }
    abstract createConnection(config: IDatabaseConfig): Promise<void>;
    abstract close(): Promise<void> 
}

export class MongooseDatabaseConnection extends DatabaseConnection<mongoose.Connection> implements IDatabaseConnection<mongoose.Connection>{
    createConnection(config: IDatabaseConfig<IMongooseConfig>): Promise<void> {
        let mongooseConfigResult = config.buildConfig();
        if(mongooseConfigResult.error) return Promise.reject(mongooseConfigResult.error);
        else {
            let mongooseConfig = mongooseConfigResult.value;
            return mongoose.createConnection(mongooseConfig.connectionString, mongooseConfig.options || {}).then((connection) => {
                this._conn = connection;
                return Promise.resolve();
            }).catch(e => {
                let error = handleError(e);
                return Promise.reject(error);
            });
        }
    }
    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._conn.close(true, (err) => {
                if(err) reject(handleError(err));
                else resolve();
            });
        });
    }
}