"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function defaultValue(input) {
    if (Array.isArray(input)) {
        return [];
    }
    else if (typeof input === "object") {
        return {};
    }
    else {
        return input;
    }
}
exports.defaultValue = defaultValue;
