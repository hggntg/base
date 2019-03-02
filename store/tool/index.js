#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
global["commander"] = commander_1.default;
require("./lib/build");
require("./lib/install");
require("./lib/set");
require("./lib/publish");
require("./lib/registry");
commander_1.default.parse(process.argv);
