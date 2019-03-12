"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = __importDefault(require("assert"));
exports.Type = {
    isString: function (input) {
        return it("should be a string", function () {
            assert_1.default.equal(typeof input === "string", true);
        });
    },
    isNumber: function (input) {
        return it("should be a number", function () {
            assert_1.default.equal(typeof input === "number", true);
        });
    },
    isObject: function (input) {
        return it("should be an object", function () {
            assert_1.default.equal(typeof input === "object", true);
        });
    },
    isArray: function (input) {
        return it("should be an array", function () {
            assert_1.default.equal(typeof input === "object" && Array.isArray(input), true);
        });
    },
    isBoolean: function (input) {
        return it("should be a boolean with input = '" + input + "'", function () {
            assert_1.default.equal(typeof input === "boolean", true);
        });
    },
    isNull: function (input) {
        return it("shoud be null", function () {
            assert_1.default.equal(input, null);
        });
    },
    isArrayOfString: function (input) {
        var isTrue = Array.isArray(input);
        if (isTrue) {
            var length = input.length;
            for (var i = 0; i < length; i++) {
                if (typeof input[i] !== "string") {
                    isTrue = false;
                    break;
                }
            }
        }
        return it("should be an array of string", function () {
            assert_1.default.equal(isTrue, true);
        });
    }
};
