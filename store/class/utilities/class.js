"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
function getClass(target) {
    if (target) {
        if (typeof target === "object" && typeof target.constructor === "function") {
            return target.constructor;
        }
        else {
            return target;
        }
    }
    else {
        throw new Error("Error target is undefined cannot identify a class");
    }
}
exports.getClass = getClass;
function getMetadata(key, classImp) {
    return Reflect.getMetadata(key, classImp);
}
exports.getMetadata = getMetadata;
function defineMetadata(key, value, classImp) {
    return Reflect.defineMetadata(key, value, classImp);
}
exports.defineMetadata = defineMetadata;
