"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var requiredField = [
    "name"
];
(function () {
    commander.command("validate <what>")
        .description("validate your service")
        .action(function (what) {
        var currentPath = process.cwd();
        if (what === "service") {
            if (fs_1.default.existsSync(path_1.default.join(currentPath, "service.json"))) {
            }
            else {
                throw new Error("service.json not found");
            }
        }
        else if (what === "module") {
        }
    });
})();
