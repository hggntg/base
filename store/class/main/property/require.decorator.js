"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var constant_1 = require("../../shared/constant");
var class_1 = require("../../utilities/class");
function Required(target, propertyKey) {
    var requires = Reflect.getMetadata(constant_1.REQUIRES_KEY, target.constructor);
    if (!requires) {
        requires = {};
    }
    requires[propertyKey] = true;
    Reflect.defineMetadata(constant_1.REQUIRES_KEY, requires, target.constructor);
}
exports.Required = Required;
function checkRequire(target) {
    var classImp = class_1.getClass(target);
    var requires = class_1.getMetadata(constant_1.REQUIRES_KEY, classImp);
    return requires;
}
exports.checkRequire = checkRequire;
