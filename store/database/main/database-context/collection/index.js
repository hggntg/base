"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var decorator_1 = require("../decorator");
function toSinglePromise(fn) {
    return new Promise(function (resolve, reject) {
        fn.then(function (res) {
            resolve(res);
        }).catch(function (err) {
            reject(err);
        });
    });
}
function toListPromise(fn) {
    return new Promise(function (resolve, reject) {
        fn.then(function (res) {
            resolve(res);
        }).catch(function (err) {
            reject(err);
        });
    });
}
var Collection = (function () {
    function Collection(classImp) {
        var dbContext = decorator_1.getDbContextMetadata(app.dbContext);
        var _model = (new classImp()).getInstance();
        console.log(_model);
        this.model = _model;
        this.connection = dbContext.connection;
    }
    Collection.prototype.find = function (conditions) {
        if (conditions === void 0) { conditions = {}; }
        return toListPromise(this.model.find(conditions));
    };
    Collection.prototype.findOne = function (conditions) {
        if (conditions === void 0) { conditions = {}; }
        return toSinglePromise(this.model.findOne(conditions));
    };
    Collection.prototype.findById = function (_id) {
        if (this.validObjectId([_id])) {
            return toSinglePromise(this.model.findById(mongoose_1.default.Types.ObjectId(_id)));
        }
        else {
            throw new Error("_id is not an ObjectId");
        }
    };
    Collection.prototype.findByIds = function (_ids) {
        if (this.validObjectId(_ids)) {
            var conditions_1 = {
                _id: {
                    $in: new Array()
                }
            };
            _ids.map(function (_id) {
                conditions_1._id.$in.push(mongoose_1.default.Types.ObjectId(_id));
            });
            return this.find(conditions_1);
        }
        else {
            throw new Error("_id is not an ObjectId");
        }
    };
    Collection.prototype.insert = function (doc) {
        var model = this.model;
        var document = new model(doc);
        this.setChanges("INSERT", document);
    };
    Collection.prototype.insertMany = function (docs) {
        var _this = this;
        var model = this.model;
        docs.map(function (doc) {
            var document = new model(doc);
            _this.setChanges("INSERT", document);
        });
    };
    Collection.prototype.remove = function (conditions) {
        var _this = this;
        if (conditions === void 0) { conditions = {}; }
        this.find(conditions).then(function (docs) {
            docs.map(function (doc) {
                _this.setChanges("REMOVE", doc);
            });
        });
    };
    Collection.prototype.removeById = function (_id) {
        var _this = this;
        this.findById(_id).then(function (doc) {
            _this.setChanges("REMOVE", doc);
        });
    };
    Collection.prototype.removeMany = function (_ids) {
        var _this = this;
        this.findByIds(_ids).then(function (docs) {
            docs.map(function (doc) {
                _this.setChanges("REMOVE", doc);
            });
        });
    };
    Collection.prototype.update = function (conditions, data) {
        var _this = this;
        this.find(conditions).then(function (docs) {
            docs.map(function (doc) {
                _this.setChanges("UPDATE", doc, data);
            });
        });
    };
    Collection.prototype.updateById = function (_id, data) {
        var _this = this;
        this.findById(_id).then(function (doc) {
            _this.setChanges("UPDATE", doc, data);
        });
    };
    Collection.prototype.updateMany = function (_ids, data) {
        var _this = this;
        this.findByIds(_ids).then(function (docs) {
            docs.map(function (doc) {
                _this.setChanges("UPDATE", doc, data);
            });
        });
    };
    Collection.prototype.count = function () {
        return this.model.countDocuments();
    };
    Collection.prototype.validObjectId = function (_ids) {
        var isValid = 1;
        _ids.map(function (_id) {
            if (mongoose_1.default.Types.ObjectId.isValid(_id)) {
                isValid *= 1;
            }
            else {
                isValid *= 0;
            }
        });
        return isValid ? true : false;
    };
    Collection.prototype.setChanges = function (type, document, data) {
        var namespace = app.context.get("dbContext");
        if (namespace) {
            var session = namespace.get("session");
            if (!session) {
                session = this.connection.startSession();
                namespace.set("session", session);
            }
            var documents = namespace.get("documents") || [];
            documents.push({ type: type, document: document, data: data });
            namespace.set("documents", documents);
        }
        else {
            throw new Error("DbContext change detector not exists");
        }
    };
    return Collection;
}());
exports.Collection = Collection;
__export(require("./decorator"));
