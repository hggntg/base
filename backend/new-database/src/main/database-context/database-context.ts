import { ICollection } from "@app/main/entity/entity-collection";

export interface IBaseDatabaseContextBehavior {
    coll(name: string): ICollection;
}

export interface IBaseDatabaseContext {

}

export abstract class DatabaseContext implements IBaseDatabaseContext {
    
}