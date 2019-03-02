"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var class_1 = require("@base/class");
var utilities_1 = require("../../infrastructure/utilities");
var constant_1 = require("../../infrastructure/constant");
var EntitySchema = (function () {
    function EntitySchema() {
        this.definition = {};
        this.schemaOptions = {};
    }
    __decorate([
        class_1.Property,
        __metadata("design:type", String)
    ], EntitySchema.prototype, "name", void 0);
    __decorate([
        class_1.Property,
        __metadata("design:type", Object)
    ], EntitySchema.prototype, "definition", void 0);
    __decorate([
        class_1.Property,
        __metadata("design:type", Object)
    ], EntitySchema.prototype, "schemaOptions", void 0);
    __decorate([
        class_1.Property,
        __metadata("design:type", mongoose_1.default.Model)
    ], EntitySchema.prototype, "model", void 0);
    __decorate([
        class_1.Property,
        __metadata("design:type", mongoose_1.default.Schema)
    ], EntitySchema.prototype, "schema", void 0);
    return EntitySchema;
}());
exports.EntitySchema = EntitySchema;
function ensureEntitySchemaInitiate(input) {
    var output = utilities_1.ensureNew(EntitySchema, input || new EntitySchema());
    return output;
}
exports.ensureEntitySchemaInitiate = ensureEntitySchemaInitiate;
function getEntitySchema(target) {
    var classImp = class_1.getClass(target);
    var schemaEntity = class_1.getMetadata(constant_1.SCHEMA_KEY, classImp);
    return schemaEntity;
}
exports.getEntitySchema = getEntitySchema;
