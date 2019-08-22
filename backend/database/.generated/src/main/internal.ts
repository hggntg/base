import mongoose, { Schema } from "mongoose";
import { IDatabaseContextSession, IDocumentChange, IEntitySchema, IFakePreAggregate, IFakePreDocument, IFakePreModel, IFakePreQuery, IFakePlugin } from "../interface";
import { ensureNew } from "../infrastructure/utilities";
import { EntitySchema } from "./entity";

export class DbContextSession implements IDatabaseContextSession{
	session: Promise<mongoose.ClientSession>;
	documents: Array<IDocumentChange>;
	constructor(_session: Promise<mongoose.ClientSession>, _documents: Array<IDocumentChange> = []){
		this.session = _session;
		this.documents = _documents;
	}

    static getType(): IClassType {
        return Type.get("DbContextSession", "class") as IClassType;
    }
}

export function getNumberOfArgument(list: Array<any>) {
    let num = 0;
    list.map(l => {
        if (l) {
            num++;
        }
    });
    return num;
}

export function generateSchema<T>(schemaEntity: IEntitySchema<T>): IEntitySchema<T> {
    let realSchema: IEntitySchema<T> = ensureNew(EntitySchema, schemaEntity);
    Object.keys(schemaEntity.definition).map(definitionKey => {
        let keySegments = definitionKey.split("::-::");
        let key = keySegments[1];
        realSchema.definition[key] = realSchema.definition[definitionKey];
        delete realSchema.definition[definitionKey];
    });
    return realSchema;
}

export function mapSchemaMiddleware<T>(schema: Schema, middleware: IFakePreAggregate | IFakePreDocument<T> | IFakePreModel<T> | IFakePreQuery | IFakePlugin) {
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