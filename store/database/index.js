"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var entity_1 = require("./main/entity");
var mongoose_1 = __importDefault(require("mongoose"));
var constant_1 = require("./infrastructure/constant");
var class_1 = require("@base/class");
var decorator_1 = require("./main/database-context/decorator");
function getNumberOfArgument(list) {
    var num = 0;
    list.map(function (l) {
        if (l) {
            num++;
        }
    });
    return num;
}
function mapSchemaPreHook(schema, preFunction) {
    var numOfArgument = getNumberOfArgument([preFunction.arg0, preFunction.arg1, preFunction.arg2]);
    if (numOfArgument === 1) {
        if (preFunction.hook === "aggregate") {
            schema.pre(preFunction.hook, preFunction.arg0);
        }
        else if (preFunction.hook === "insertMany") {
            schema.pre(preFunction.hook, preFunction.arg0);
        }
        else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
            schema.pre(preFunction.hook, preFunction.arg0);
        }
        else {
            schema.pre(preFunction.hook, preFunction.arg0);
        }
    }
    else if (numOfArgument === 2) {
        if (typeof preFunction.arg0 === "boolean") {
            if (preFunction.hook === "aggregate") {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
            else if (preFunction.hook === "insertMany") {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
            else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
            else {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
        }
        else {
            if (preFunction.hook === "aggregate") {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
            else if (preFunction.hook === "insertMany") {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
            else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
            else {
                schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1);
            }
        }
    }
    else {
        if (preFunction.hook === "aggregate") {
            schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1, preFunction.arg2);
        }
        else if (preFunction.hook === "insertMany") {
            schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1, preFunction.arg2);
        }
        else if (preFunction.hook === "init" || preFunction.hook === "save" || preFunction.hook === "validate" || preFunction.hook === "remove") {
            schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1, preFunction.arg2);
        }
        else {
            schema.pre(preFunction.hook, preFunction.arg0, preFunction.arg1, preFunction.arg2);
        }
    }
}
app.connectDatabase = function (entities, context, unitOfWork) {
    var dbContext = decorator_1.getDbContextMetadata(app.dbContext);
    var connectionInfo = dbContext.connectionInfo;
    return new Promise(function (resolve, reject) {
        mongoose_1.default.createConnection(connectionInfo.uri, connectionInfo.connectionOptions).then(function (connection) {
            dbContext.connection = connection;
            class_1.defineMetadata(constant_1.DBCONTEXT_KEY, dbContext, class_1.getClass(app.dbContext));
            try {
                Object.keys(entities).map(function (entityKey) {
                    var schemaEntity = entity_1.getEntitySchema(entities[entityKey]);
                    schemaEntity.schema = new mongoose_1.default.Schema(schemaEntity.definition, schemaEntity.schemaOptions);
                    schemaEntity.model = connection.model(schemaEntity.name, schemaEntity.schema);
                    schemaEntity.preFunction.map(function (preFunction) {
                        mapSchemaPreHook(schemaEntity.schema, preFunction);
                    });
                    class_1.defineMetadata(constant_1.SCHEMA_KEY, schemaEntity, class_1.getClass(entities[entityKey]));
                });
                var dbContext_1 = new context();
                app.db = new unitOfWork(dbContext_1);
                resolve(true);
            }
            catch (e) {
                throw new Error(e);
            }
        }).catch(function (err) {
            reject(err);
        });
    });
};
__export(require("./main/database-context"));
__export(require("./main/entity"));
__export(require("./main/repository"));
__export(require("./main/unit-of-work"));
