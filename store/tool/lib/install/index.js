"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var internal_1 = require("../../internal");
var module_1 = require("./module");
(function () {
    commander.command("install <what>")
        .description("install module")
        .option("-n, --name [moduleName]", "module name")
        .action(function (what, commands) {
        commands.name = internal_1.defaultValue(commands.name, "string");
        if (what === "module") {
            module_1.installModule(commands.name);
        }
    });
})();
