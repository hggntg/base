"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var shelljs_1 = __importDefault(require("shelljs"));
var path_1 = __importDefault(require("path"));
var utilities_1 = require("../infrastructure/utilities");
(function () {
    commander.command("publish <name>")
        .description("publish module to registry")
        .action(function (name) {
        var storePath = utilities_1.getRootBasePath();
        var modulePath = path_1.default.join(storePath, name);
        var registry = utilities_1.getConfig("registry");
        shelljs_1.default.cd(modulePath);
        shelljs_1.default.exec("npm publish --registry" + registry);
    });
})();
