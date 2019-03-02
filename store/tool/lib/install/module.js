"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var shelljs_1 = __importDefault(require("shelljs"));
var fs_1 = __importDefault(require("fs"));
var utilities_1 = require("../../infrastructure/utilities");
function installModule(name) {
    var storePath = utilities_1.getRootBasePath();
    var sourcePath = process.cwd();
    var modulePath = path_1.default.join(storePath, name);
    var packageJSONModule = fs_1.default.readFileSync(path_1.default.join(modulePath, "package.json")).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
    var packageObjectModule = JSON.parse(packageJSONModule);
    var moduleName = packageObjectModule.name;
    var moduleJSONSource = fs_1.default.readFileSync(path_1.default.join(sourcePath, "info.json")).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
    var moduleObjectSource = JSON.parse(moduleJSONSource);
    moduleObjectSource.dependencies[moduleName] = modulePath;
    fs_1.default.writeFileSync(path_1.default.join(sourcePath, "info.json"), JSON.stringify(moduleObjectSource, null, "\t"));
    shelljs_1.default.exec("npm install " + modulePath + " --save");
}
exports.installModule = installModule;
