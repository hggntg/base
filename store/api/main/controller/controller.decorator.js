"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var constant_1 = require("../../shared/constant");
var class_1 = require("@base/class");
var ControllerImp = (function () {
    function ControllerImp(_uowInstance) {
        this.subApp = express_1.default();
        this.uowInstance = _uowInstance;
        this.register();
    }
    ControllerImp.prototype.register = function () {
        var _this = this;
        var controllerProperty = class_1.getMetadata(constant_1.CONTROLLER_KEY, class_1.getClass(this));
        var properties = class_1.getProperties(class_1.getClass(this));
        properties.map(function (property) {
            var routeConfig = controllerProperty.routes[property];
            _this.subApp[routeConfig.method.toLowerCase()](routeConfig.url, function (req, res) {
                var result = _this[property](checkInput(req, res));
                if (typeof result.then === "function" && typeof result.catch === "function") {
                    result.then(function (value) {
                        res.json(value);
                    }).catch(function (err) {
                        res.json(err);
                    });
                }
                else {
                    res.json(result);
                }
            });
        });
    };
    return ControllerImp;
}());
exports.ControllerImp = ControllerImp;
function Controller(routeBase) {
    return function (target) {
        var classImp = class_1.getClass(target);
        var controllerProperty = class_1.getMetadata(constant_1.CONTROLLER_KEY, classImp);
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {}
            };
        }
        if (routeBase.indexOf("/") !== 0) {
            routeBase = "/" + routeBase;
        }
        controllerProperty.name = classImp.name;
        controllerProperty.routeBase = routeBase;
        class_1.defineMetadata(constant_1.CONTROLLER_KEY, controllerProperty, target.constructor);
    };
}
exports.Controller = Controller;
function Route(routeConfig) {
    return function (target, propertyKey, descriptor) {
        class_1.Property(target, propertyKey);
        var controllerProperty = class_1.getMetadata(constant_1.CONTROLLER_KEY, class_1.getClass(target));
        if (!controllerProperty) {
            controllerProperty = {
                name: "",
                routeBase: "",
                routes: {}
            };
        }
        if (routeConfig.url.indexOf("/") !== 0) {
            routeConfig.url = "/" + routeConfig.url;
        }
        controllerProperty.routes[propertyKey] = routeConfig;
        class_1.defineMetadata(constant_1.CONTROLLER_KEY, controllerProperty, target.constructor);
    };
}
exports.Route = Route;
function getController(target) {
    var classImp = class_1.getClass(target);
    var controllerProperty = class_1.getMetadata(constant_1.CONTROLLER_KEY, classImp);
    return controllerProperty;
}
exports.getController = getController;
function checkInput(req, res) {
    var input = {
        query: req.query,
        params: req.params,
        body: req.body
    };
    return input;
}
