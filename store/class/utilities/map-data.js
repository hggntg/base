"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var property_1 = require("../main/property");
function mapData(ClassImp, source) {
    var properties = property_1.getProperties(ClassImp);
    var requires = property_1.checkRequire(ClassImp);
    var isValid = 1;
    var result = null;
    if (requires) {
        Object.keys(requires).map(function (key) {
            if (requires[key]) {
                isValid *= source[key] ? 1 : 0;
            }
            else {
                isValid *= 1;
            }
        });
    }
    if (isValid) {
        properties.map(function (property) {
            if (!result) {
                result = new ClassImp();
            }
            if (typeof source[property] === "object") {
                result[property] = Object.assign({}, source[property]);
            }
            else {
                result[property] = source[property];
            }
        });
    }
    return result;
}
exports.mapData = mapData;
