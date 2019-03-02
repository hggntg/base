"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var collection_1 = require("./collection");
var class_1 = require("@base/class");
var decorator_1 = require("./decorator");
var DbContextSession = (function () {
    function DbContextSession(_session, _documents) {
        if (_documents === void 0) { _documents = []; }
        this.session = _session;
        this.documents = _documents;
    }
    return DbContextSession;
}());
var DatabaseContext = (function () {
    function DatabaseContext() {
        var _this = this;
        var properties = class_1.getProperties(this);
        var dbContext = decorator_1.getDbContextMetadata(app.dbContext);
        console.log("=================================");
        console.log(dbContext);
        properties.map(function (property) {
            var classImp = dbContext.classes[property];
            _this[property] = new collection_1.Collection(classImp);
        });
    }
    DatabaseContext.prototype.list = function (name) {
        return this[name];
    };
    DatabaseContext.prototype.saveChanges = function () {
        var dbContextSession = this.getDbContextSession();
        var session = null;
        var namespace = app.context.get("dbContext");
        namespace.remove("documents");
        return dbContextSession.session.then(function (_session) {
            session = _session;
            session.startTransaction();
            var promiseList = [];
            try {
                var documentLength = dbContextSession.documents.length;
                for (var i = 0; i < documentLength; i++) {
                    var change = dbContextSession.documents[i];
                    var document = change.document;
                    if (change.type === "UPDATE") {
                        document.update(change.data);
                    }
                    else {
                        document.remove();
                    }
                    promiseList.push(document.save());
                }
                return Promise.all(promiseList);
            }
            catch (e) {
                throw e;
            }
        }).then(function () {
            return session.commitTransaction().then(function () {
                return session.endSession();
            });
        }).catch(function (err) {
            console.error(err);
            return session.abortTransaction().then(function () {
                return session.endSession();
            });
        });
    };
    DatabaseContext.prototype.getDbContextSession = function () {
        var dbContext = decorator_1.getDbContextMetadata(this);
        var namespace = app.context.get("dbContext");
        var session = namespace.get("session");
        if (!session) {
            session = dbContext.connection.startSession();
        }
        var dbContextSession = new DbContextSession(session);
        dbContextSession.documents = namespace.get("documents");
        return dbContextSession;
    };
    return DatabaseContext;
}());
exports.DatabaseContext = DatabaseContext;
__export(require("./decorator"));
__export(require("./collection"));
