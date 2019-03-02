"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var internal_1 = require("../../internal");
var app_1 = require("./app");
var module_1 = require("./module");
(function () {
    commander.command("build <what>")
        .description("build your app")
        .option("--live", "build your app and serve app live")
        .option("--test", "apply test before serve")
        .option("--name [moduleName]", "name of your module")
        .action(function (what, commands) {
        commands.live = internal_1.defaultValue(commands.live, "boolean");
        commands.test = internal_1.defaultValue(commands.test, "boolean");
        var path = process.cwd();
        if (what === "service") {
            app_1.buildService();
        }
        else if (what === "module") {
            module_1.buildModule(commands.name);
        }
    });
})();
