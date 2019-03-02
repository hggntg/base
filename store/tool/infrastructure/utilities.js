"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var toolPath = path_1.default.join(__dirname, "../tool.json");
function getConfig(key) {
    var configJSON = fs_1.default.readFileSync(toolPath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
    var config = JSON.parse(configJSON);
    return config[key];
}
exports.getConfig = getConfig;
function getRootBasePath() {
    return getConfig("basePath");
}
exports.getRootBasePath = getRootBasePath;
