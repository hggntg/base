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
function Entity(name, options) {
    return function (target) {
        var schema = class_1.getMetadata(constant_1.SCHEMA_KEY, class_1.getClass(target));
        schema = entity_schema_1.ensureEntitySchemaInitiate(schema);
        if (!name) {
            name = target.name;
        }
        if (typeof name !== "string") {
            options = name;
            name = target.name;
        }
        schema.name = name;
        schema.schemaOptions = options;
        class_1.defineMetadata(constant_1.SCHEMA_KEY, schema, class_1.getClass(target));
    };
}
exports.Entity = Entity;
