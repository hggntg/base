"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("@base/class");
var decorator_1 = require("../decorator");
var constant_1 = require("../../../infrastructure/constant");
function DCollection(classImp) {
    return function (target, propertyKey) {
        class_1.Property(target, propertyKey);
        var dbContext = decorator_1.getDbContextMetadata(target);
        if (!dbContext) {
            dbContext = new decorator_1.DbContextMetadata();
        }
        if (!dbContext.classes) {
            dbContext.classes = {};
        }
        dbContext.classes[propertyKey] = classImp;
        class_1.defineMetadata(constant_1.DBCONTEXT_KEY, dbContext, class_1.getClass(target));
    };
}
exports.DCollection = DCollection;
