"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var entity_schema_1 = require("./entity-schema");
var BaseEntity = (function () {
    function BaseEntity() {
    }
    BaseEntity.prototype.getInstance = function () {
        var entitySchema = entity_schema_1.getEntitySchema(this);
        return entitySchema.model;
    };
    return BaseEntity;
}());
exports.BaseEntity = BaseEntity;
__export(require("./decorator"));
__export(require("./entity-schema"));
