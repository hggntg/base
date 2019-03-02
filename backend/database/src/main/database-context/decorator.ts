import mongoose from "mongoose";
import { App, IBaseEntity } from "@base/interfaces";
import { IExtendDatabase } from "../../internal";
import { defineMetadata, getClass, getMetadata } from "@base/class";
import { DBCONTEXT_KEY } from "../../infrastructure/constant";
import { ICollection } from "./collection";

declare const app: App & IExtendDatabase;

export interface IDbContextMetadata {
	connectionInfo: {
		uri: string;
		connectionOptions: mongoose.ConnectionOptions
	};
	connection: mongoose.Connection,
	classes: {
		[key: string]: {new () : IBaseEntity}
	}
}

export function DBContext(uri: string, connectionOptions: mongoose.ConnectionOptions) {
	return function (target: object) {
		app.dbContext = target;
		let dbContext: IDbContextMetadata = getDbContextMetadata(target);
		if (!dbContext) {
			dbContext = new DbContextMetadata();
		}
		connectionOptions.useNewUrlParser = true;
		dbContext.connectionInfo = {
			uri: uri,
			connectionOptions: connectionOptions
		}
		defineMetadata(DBCONTEXT_KEY, dbContext, getClass(target));
	}
}
export function getDbContextMetadata(target: any) : IDbContextMetadata{
	let classImp = getClass(target);
	let dbContext = getMetadata(DBCONTEXT_KEY, classImp);
	return dbContext;
}

export class DbContextMetadata implements IDbContextMetadata {
	connectionInfo: { uri: string; connectionOptions: mongoose.ConnectionOptions; };
	connection: mongoose.Connection;
	classes: { [key: string]:  {new () : IBaseEntity}; };
	collections: {
		[key: string]: ICollection<IBaseEntity>
	}
}
