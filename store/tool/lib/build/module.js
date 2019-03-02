"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var shelljs_1 = __importDefault(require("shelljs"));
var utilities_1 = require("../../infrastructure/utilities");
var rimraf_1 = __importDefault(require("rimraf"));
function buildModule(name) {
    var storePath = utilities_1.getRootBasePath();
    var sourcePath = process.cwd();
    var destPath = path_1.default.join(storePath, name);
    if (fs_1.default.existsSync(destPath)) {
        rimraf_1.default.sync(destPath);
    }
    fs_1.default.mkdirSync(destPath);
    shelljs_1.default.cp("-R", path_1.default.join(sourcePath, "package.json"), path_1.default.join(destPath, "package.json"));
    shelljs_1.default.exec("tsc --outDir " + destPath);
}
exports.buildModule = buildModule;
