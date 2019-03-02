"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("@base/class");
var constant_1 = require("../../infrastructure/constant");
function DBContext(uri, connectionOptions) {
    return function (target) {
        app.dbContext = target;
        var dbContext = getDbContextMetadata(target);
        if (!dbContext) {
            dbContext = new DbContextMetadata();
        }
        connectionOptions.useNewUrlParser = true;
        dbContext.connectionInfo = {
            uri: uri,
            connectionOptions: connectionOptions
        };
        class_1.defineMetadata(constant_1.DBCONTEXT_KEY, dbContext, class_1.getClass(target));
    };
}
exports.DBContext = DBContext;
function getDbContextMetadata(target) {
    var classImp = class_1.getClass(target);
    var dbContext = class_1.getMetadata(constant_1.DBCONTEXT_KEY, classImp);
    return dbContext;
}
exports.getDbContextMetadata = getDbContextMetadata;
var DbContextMetadata = (function () {
    function DbContextMetadata() {
    }
    return DbContextMetadata;
}());
exports.DbContextMetadata = DbContextMetadata;
