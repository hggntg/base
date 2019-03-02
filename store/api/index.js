"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var morgan_1 = __importDefault(require("morgan"));
var body_parser_1 = require("body-parser");
var uuid_1 = require("uuid");
var controller_1 = require("./main/controller");
app.server = express_1.default();
__export(require("./main/controller"));
app.startServer = function (port, unitOfWorkInstance, controllers) {
    var _this = this;
    var namespace = app.context.create("dbContext");
    app.server.use(body_parser_1.json({}));
    app.server.use(body_parser_1.urlencoded({ extended: true }));
    app.server.use(morgan_1.default("combined"));
    app.server.use(function (req, res, next) {
        namespace.run(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                namespace.set("tid", uuid_1.v1());
                next();
                return [2];
            });
        }); }).catch(function (e) {
            console.error(e);
        });
        res.once("finish", function () {
            namespace.dispose();
        });
    });
    Object.keys(controllers).map(function (controllerKey) {
        var classImp = controllers[controllerKey];
        var controller = new classImp(unitOfWorkInstance);
        var controllerProperty = controller_1.getController(classImp);
        app.server.use(controllerProperty.routeBase, controller.subApp);
    });
    return new Promise(function (resolve, reject) {
        app.server.listen(port, function () {
            resolve(true);
        })
            .once("error", function (err) {
            reject(err);
        });
    });
};
