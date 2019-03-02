"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var constant_1 = require("../../shared/constant");
var class_1 = require("../../utilities/class");
function Property(target, propertyKey) {
    var columns = Reflect.getMetadata(constant_1.PROPERTIES_KEY, target.constructor) || [];
    var requires = Reflect.getMetadata(constant_1.REQUIRES_KEY, target.constructor);
    columns.push(propertyKey);
    if (!requires) {
        requires = {};
    }
    if (!requires[propertyKey]) {
        requires[propertyKey] = false;
    }
    Reflect.defineMetadata(constant_1.PROPERTIES_KEY, columns, target.constructor);
    Reflect.defineMetadata(constant_1.REQUIRES_KEY, requires, target.constructor);
}
exports.Property = Property;
function getProperties(target) {
    var classImp = class_1.getClass(target);
    var properties = class_1.getMetadata(constant_1.PROPERTIES_KEY, classImp);
    return properties || [];
}
exports.getProperties = getProperties;
