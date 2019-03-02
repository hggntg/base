"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = __importStar(require("dotenv"));
require("reflect-metadata");
var inversify_1 = require("inversify");
var objectPath = __importStar(require("object-path"));
var class_1 = require("@base/class");
var namespace_1 = require("@base/utilities/namespace");
var events_1 = require("events");
exports.CONFIG = Symbol.for("Config");
exports.APP = Symbol.for("App");
var ContainerRoot = new inversify_1.Container();
var ConfigAbs = (function () {
    function ConfigAbs() {
    }
    ConfigAbs = __decorate([
        inversify_1.injectable(),
        __metadata("design:paramtypes", [])
    ], ConfigAbs);
    return ConfigAbs;
}());
var DoubleConfigImp = (function (_super) {
    __extends(DoubleConfigImp, _super);
    function DoubleConfigImp() {
        return _super.call(this) || this;
    }
    DoubleConfigImp.prototype.setConfig = function (_configRoot) {
        this.configRoot = _configRoot;
    };
    DoubleConfigImp.prototype.getSection = function (ClassImp, sectionName) {
        var dynamicResult = objectPath.get(this.configRoot, sectionName, null);
        return class_1.mapData(ClassImp, dynamicResult);
    };
    return DoubleConfigImp;
}(ConfigAbs));
var AppImp = (function () {
    function AppImp() {
        var _this = this;
        this.event = new events_1.EventEmitter();
        this.preStartAppTasks = new Array();
        this.context = namespace_1.Namespace;
        this.once("preStartApp", function () {
            console.log("App is initializing");
            var promiseList = [];
            _this.preStartAppTasks.map(function (preTask) {
                promiseList.push(preTask);
            });
            Promise.all(promiseList).then(function (sucess) {
                console.log(sucess);
                _this.event.emit("startAppDone", null);
            }).catch(function (err) {
                throw new Error(err);
            });
        });
        this.once("startAppDone", function () {
            console.log("App is started successfuly");
        });
    }
    AppImp.prototype.loadConfig = function (path) {
        var envConfig = dotenv.config({ path: path });
        if (envConfig.error) {
            throw envConfig.error;
        }
        var configPath = envConfig.parsed.NODE_CONFIG_DIR;
        if (!configPath) {
            throw new Error("Missing NODE_CONFIG_DIR in .env");
        }
        var config = require("config");
        this.config = ContainerRoot.get(exports.CONFIG);
        this.config.setConfig(config);
    };
    AppImp.prototype.serveAs = function (_type) {
        this.type = _type;
    };
    AppImp.prototype.use = function (plugin, preStartApp) {
        try {
            if (preStartApp) {
                this.preStartAppTasks.push(plugin);
            }
        }
        catch (e) {
            throw new Error(e);
        }
        return this;
    };
    AppImp.prototype.once = function (event, cb) {
        return this.event.once(event, cb);
    };
    AppImp.prototype.start = function () {
        this.event.emit("preStartApp", null);
    };
    AppImp = __decorate([
        inversify_1.injectable(),
        __metadata("design:paramtypes", [])
    ], AppImp);
    return AppImp;
}());
exports.AppImp = AppImp;
var APP_MODULE = new inversify_1.ContainerModule(function (bind) {
    bind(exports.CONFIG).to(DoubleConfigImp);
    bind(exports.APP).to(AppImp);
});
ContainerRoot.load(APP_MODULE);
