"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var add_try_catch_wrapper_1 = require("@base/utilities/add-try-catch-wrapper");
function Repository(target) {
    Object.keys(target.prototype).map(function (funcName) {
        add_try_catch_wrapper_1.addTryCatchWrapper(target, funcName);
    });
    return target;
}
exports.Repository = Repository;
