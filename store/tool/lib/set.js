"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var shelljs_1 = __importDefault(require("shelljs"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
(function () {
    commander.command("set <key> <value>")
        .description("install module")
        .action(function (key, value) {
        var toolPath = path_1.default.join(__dirname, "../tool.json");
        if (!fs_1.default.existsSync(toolPath)) {
            fs_1.default.writeFileSync(toolPath, "{}");
        }
        var configJSON = fs_1.default.readFileSync(toolPath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
        var config = JSON.parse(configJSON);
        config[key] = value;
        if (key === "registry") {
            shelljs_1.default.exec("npm set @base:registry " + value);
        }
        fs_1.default.writeFileSync(toolPath, JSON.stringify(config, null, "\t"));
    });
})();
