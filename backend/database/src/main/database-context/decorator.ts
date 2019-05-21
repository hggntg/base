import mongoose from "mongoose";
import { defineMetadata, getClass, getMetadata } from "@base/class";
import { DBCONTEXT_KEY } from "../../infrastructure/constant";
import { IDbContextMetadata, ICollection, IBaseEntity } from "@base-interfaces/database";
import { INamespace } from "@base-interfaces/utilities";
import { Namespace } from "@base/utilities/namespace";
import { ILogger } from "@base-interfaces/logger";
import { Logger } from "@base/logger";

export function DBContext(uri: string, connectionOptions: mongoose.ConnectionOptions, tracer: ILogger) {
	return function (target: object) {
		let dbContext: IDbContextMetadata = getDbContextMetadata(target);
		if (!dbContext) {
			dbContext = new DbContextMetadata();
		}
		connectionOptions.useNewUrlParser = true;
		connectionOptions.useCreateIndex = true;
		connectionOptions.useFindAndModify = false;
		dbContext.connectionInfo = {
			uri: uri,
			connectionOptions: connectionOptions
		}
		if(!dbContext.context){
			dbContext.context = Namespace.create("dbContext");
		}
		dbContext.tracer = tracer;
		dbContext.tracer = tracer ? tracer : new Logger("database-context");
		defineMetadata(DBCONTEXT_KEY, dbContext, getClass(target));
	}
}
export function getDbContextMetadata(target: any) : IDbContextMetadata{
	let classImp = getClass(target);
	let dbContext = getMetadata(DBCONTEXT_KEY, classImp);
	return dbContext;
}

export class DbContextMetadata implements IDbContextMetadata {
	context: INamespace;
	connectionInfo: { uri: string; connectionOptions: mongoose.ConnectionOptions; };
	connection: mongoose.Connection;
	classes: { [key: string]:  {new () : IBaseEntity}; };
	collections: {
		[key: string]: ICollection<IBaseEntity>
	}
	tracer: ILogger;
}
