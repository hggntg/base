"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var BaseRepository = (function () {
    function BaseRepository(_collection) {
        this.collection = _collection;
    }
    BaseRepository.prototype.find = function (conditions) {
        return this.collection.find(conditions);
    };
    BaseRepository.prototype.findOne = function (conditions) {
        return this.collection.findOne(conditions);
    };
    BaseRepository.prototype.findById = function (_id) {
        return this.collection.findById(_id);
    };
    BaseRepository.prototype.insert = function (doc) {
        return this.collection.insert(doc);
    };
    BaseRepository.prototype.insertMany = function (docs) {
        return this.collection.insertMany(docs);
    };
    BaseRepository.prototype.remove = function (conditions) {
        return this.collection.remove(conditions);
    };
    BaseRepository.prototype.removeById = function (_id) {
        return this.collection.removeById(_id);
    };
    BaseRepository.prototype.removeMany = function (_ids) {
        return this.collection.removeMany(_ids);
    };
    BaseRepository.prototype.update = function (conditions, data) {
        return this.collection.update(conditions, data);
    };
    BaseRepository.prototype.updateById = function (_id, data) {
        return this.collection.updateById(_id, data);
    };
    BaseRepository.prototype.updateMany = function (_ids, data) {
        return this.collection.updateMany(_ids, data);
    };
    BaseRepository.prototype.count = function () {
        return this.collection.count();
    };
    return BaseRepository;
}());
exports.BaseRepository = BaseRepository;
__export(require("./decorator"));
