"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("@base/class");
var constant_1 = require("../../../infrastructure/constant");
var decorator_1 = require("../decorator");
function RepositoryProperty(classImp) {
    return function (target, propertyKey) {
        class_1.Property(target, propertyKey);
        var unitOfWork = decorator_1.getUnitOfWorkMetadata(class_1.getClass(target));
        if (!unitOfWork) {
            unitOfWork = {
                classes: {}
            };
        }
        unitOfWork.classes[propertyKey] = classImp;
        class_1.defineMetadata(constant_1.UNIT_OF_WORK_KEY, unitOfWork, class_1.getClass(target));
    };
}
exports.RepositoryProperty = RepositoryProperty;
