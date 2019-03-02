"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = __importDefault(require("child_process"));
var utilities_1 = require("../../infrastructure/utilities");
function addUser() {
    var registry = utilities_1.getConfig("registry");
    child_process_1.default.execSync("npm adduser --registry " + registry, { stdio: "inherit" });
}
exports.addUser = addUser;
