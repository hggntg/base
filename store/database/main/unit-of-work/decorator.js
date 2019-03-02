"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("@base/class");
var constant_1 = require("../../infrastructure/constant");
function getUnitOfWorkMetadata(target) {
    var classImp = class_1.getClass(target);
    var unitOfWork = class_1.getMetadata(constant_1.UNIT_OF_WORK_KEY, classImp);
    return unitOfWork;
}
exports.getUnitOfWorkMetadata = getUnitOfWorkMetadata;
