"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("@base/class");
var constant_1 = require("../../infrastructure/constant");
var entity_schema_1 = require("./entity-schema");
var mongoose_1 = __importDefault(require("mongoose"));
function Id() {
    return function (target, propertyKey) {
        class_1.Property(target, propertyKey);
        var schema = class_1.getMetadata(constant_1.SCHEMA_KEY, class_1.getClass(target));
        schema = entity_schema_1.ensureEntitySchemaInitiate(schema);
        schema.definition[propertyKey + "::-::_id"] = {
            type: mongoose_1.default.SchemaTypes.ObjectId,
            auto: true
        };
        class_1.defineMetadata(constant_1.SCHEMA_KEY, schema, class_1.getClass(target));
    };
}
exports.Id = Id;
function Field(name, entitySchemaField) {
    return function (target, propertyKey) {
        class_1.Property(target, propertyKey);
        var schema = class_1.getMetadata(constant_1.SCHEMA_KEY, class_1.getClass(target));
        schema = entity_schema_1.ensureEntitySchemaInitiate(schema);
        if (!name) {
            name = propertyKey;
        }
        if (typeof name !== "string") {
            entitySchemaField = name;
            name = propertyKey;
        }
        schema.definition[propertyKey + "::-::" + name] = entitySchemaField;
        class_1.defineMetadata(constant_1.SCHEMA_KEY, schema, class_1.getClass(target));
    };
}
exports.Field = Field;
function RelatedField(name, relatedEntity) {
    return function (target, propertyKey) {
        class_1.Property(target, propertyKey);
        var schema = class_1.getMetadata(constant_1.SCHEMA_KEY, class_1.getClass(target));
        schema = entity_schema_1.ensureEntitySchemaInitiate(schema);
        if (typeof name !== "string") {
            relatedEntity = name;
            name = propertyKey;
        }
    };
}
exports.RelatedField = RelatedField;
var FakeSchemaPreFunction = (function () {
    function FakeSchemaPreFunction(_preFunction) {
        if (_preFunction === void 0) { _preFunction = new Array(); }
        this.preFunction = new Array();
        this.preFunction = _preFunction;
    }
    FakeSchemaPreFunction.prototype.pre = function (hook, arg0, arg1, arg2) {
        var preFunction = {
            hook: hook,
            arg0: arg0,
            arg1: arg1,
            arg2: arg2
        };
        if (hook === "aggregate") {
            this.preFunction.push(preFunction);
        }
        else if (hook === "insertMany") {
            this.preFunction.push(preFunction);
        }
        else if (hook === "init" || hook === "save" || hook === "remove" || hook === "validate") {
            this.preFunction.push(preFunction);
        }
        else {
            this.preFunction.push(preFunction);
        }
        return this;
    };
    return FakeSchemaPreFunction;
}());
function isSchemaOptions(input) {
    var isSchemaOption = 1;
    Object.keys(input).map(function (key) {
        isSchemaOption *= input[key] !== undefined ? 1 : 0;
    });
    return !!isSchemaOption;
}
function Entity(arg0, arg1, arg2) {
    return function (target) {
        var schema = class_1.getMetadata(constant_1.SCHEMA_KEY, class_1.getClass(target));
        schema = entity_schema_1.ensureEntitySchemaInitiate(schema);
        schema.preFunction = [];
        var hook = new FakeSchemaPreFunction(schema.preFunction);
        if (typeof arg0 === "string" && isSchemaOptions(arg1) && typeof arg2 === "function") {
            schema.name = arg0;
            schema.schemaOptions = arg1;
            arg2.apply(hook);
        }
        else if (isSchemaOptions(arg0) && typeof arg2 === "function") {
            schema.name = target.name;
            schema.schemaOptions = arg0;
            arg2.apply(hook);
        }
        else if (typeof arg0 === "string" && isSchemaOptions(arg1)) {
            schema.name = arg0;
            schema.schemaOptions = arg1;
        }
        else {
            schema.name = target.name;
            schema.schemaOptions = arg0;
        }
        class_1.defineMetadata(constant_1.SCHEMA_KEY, schema, class_1.getClass(target));
    };
}
exports.Entity = Entity;
