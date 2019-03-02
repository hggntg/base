"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("@base/class");
function ensureNew(classImp, input) {
    if (typeof input === "object") {
        var output = class_1.mapData(classImp, input);
        return output;
    }
    return input;
}
exports.ensureNew = ensureNew;
