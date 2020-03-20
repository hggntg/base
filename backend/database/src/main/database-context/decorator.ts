import mongoose from "mongoose";
import { DBCONTEXT_KEY } from "@app/infrastructure/constant";
import { IDbContextMetadata, ICollection, IBaseEntity } from "@app/interface";

export function DBContext(uri: string, connectionOptions: mongoose.ConnectionOptions) {
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
			let context = Namespace.get("dbContext");
			dbContext.context = context || Namespace.create("dbContext");
		}
		defineMetadata(DBCONTEXT_KEY, dbContext, getClass(target));
	}
}
export function getDbContextMetadata(target: any) : IDbContextMetadata{
	let classImp = getClass(target);
	let dbContext = getMetadata<IDbContextMetadata>(DBCONTEXT_KEY, classImp);
	return dbContext;
}

export class DbContextMetadata implements IDbContextMetadata {
	context: INamespace;
	connectionInfo: { uri: string; connectionOptions: mongoose.ConnectionOptions; };
	connection: mongoose.Connection;
	classes: { [key: string]:  {new () : IBaseEntity}; };
	collections: {
		[key: string]: ICollection<any, IBaseEntity>
	};
	tracker?: any;
}