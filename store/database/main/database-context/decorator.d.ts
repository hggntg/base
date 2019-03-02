import mongoose from "mongoose";
import { IBaseEntity } from "@base/interfaces";
import { ICollection } from "./collection";
export interface IDbContextMetadata {
    connectionInfo: {
        uri: string;
        connectionOptions: mongoose.ConnectionOptions;
    };
    connection: mongoose.Connection;
    classes: {
        [key: string]: {
            new (): IBaseEntity;
        };
    };
}
export declare function DBContext(uri: string, connectionOptions: mongoose.ConnectionOptions): (target: object) => void;
export declare function getDbContextMetadata(target: any): IDbContextMetadata;
export declare class DbContextMetadata implements IDbContextMetadata {
    connectionInfo: {
        uri: string;
        connectionOptions: mongoose.ConnectionOptions;
    };
    connection: mongoose.Connection;
    classes: {
        [key: string]: {
            new (): IBaseEntity;
        };
    };
    collections: {
        [key: string]: ICollection<IBaseEntity>;
    };
}
