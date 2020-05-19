import {    
    IUnitOfWork, IDatabaseContext 
} from "@base/database";

import { App } from "@base/builder";

export interface IExtendDatabase{
    db: IUnitOfWork;
    initDatabase?(dbContext: IDatabaseContext): void;
    establishDatabaseConnection?(): Promise<boolean>;
}

export class ExtendDatabase extends App implements IExtendDatabase{
    private dbContext: IDatabaseContext;
    db: IUnitOfWork;
    initDatabase(dbContext: IDatabaseContext): void {
        this.dbContext = dbContext;
    }
    establishDatabaseConnection(): Promise<boolean> {
        return this.dbContext.createConnection().catch(e => {
            this.report({
                description: "Mongodb is down",
                event: "mongodb.down",
                level: "green",
                meta: {},
                needToRestart: true
            });
            return Promise.reject(e);
        });
    }
}