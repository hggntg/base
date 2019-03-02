"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var decorator_1 = require("./decorator");
var class_1 = require("@base/class");
var AUnitOfWork = (function () {
    function AUnitOfWork(_dbContext) {
        var _this = this;
        this.dbContext = _dbContext;
        var unitOfWork = decorator_1.getUnitOfWorkMetadata(this);
        var properties = class_1.getProperties(this);
        properties.map(function (property) {
            var classImp = unitOfWork.classes[property];
            _this[property] = new classImp(_dbContext.list(property));
        });
        app.db = this;
    }
    AUnitOfWork.prototype.list = function (name) {
        return this[name];
    };
    AUnitOfWork.prototype.saveChanges = function () {
        return this.dbContext.saveChanges();
    };
    return AUnitOfWork;
}());
exports.AUnitOfWork = AUnitOfWork;
__export(require("./decorator"));
__export(require("./repository"));
