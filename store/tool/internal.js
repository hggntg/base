"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentPath = process.cwd();
function defaultValue(input, type) {
    if (typeof input !== type && typeof input !== "undefined") {
        if (type === "array") {
            if (!Array.isArray(input)) {
                return input;
            }
        }
        else {
            return input;
        }
    }
    else {
        if (type === "boolean") {
            return input ? input : false;
        }
        else if (type === "string") {
            return input ? input : "";
        }
        else if (type === "number") {
            return input ? input : 0;
        }
        else if (type === "object") {
            return input ? input : {};
        }
        else {
            return input ? input : [];
        }
    }
}
exports.defaultValue = defaultValue;
