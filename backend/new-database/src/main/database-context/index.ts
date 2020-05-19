import { IDatabaseConnection, IDatabaseConfig, IMongooseConfig, MongooseDatabaseConnection } from "@app/infrastructure";

export interface IDatabaseContext<T = any> {
    databaseConnection: IDatabaseConnection<T>;
    createConnection(config: IDatabaseConfig): Promise<void>;
}

export abstract class DatabaseContext<T = any> implements IDatabaseContext<T> {
    databaseConnection: IDatabaseConnection<T>;
    abstract createConnection(config: IDatabaseConfig): Promise<void>;
}
export class MongooseDatabaseContext extends DatabaseContext<IMongooseConfig> implements IDatabaseContext<IMongooseConfig>{
    databaseConnection: IDatabaseConnection;
    constructor(){
        super();
        this.databaseConnection = new MongooseDatabaseConnection();
    }
    createConnection(config: IDatabaseConfig): Promise<void> {
        return this.databaseConnection.createConnection(config);
    }
}