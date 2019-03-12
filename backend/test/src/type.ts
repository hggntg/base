import assert from "assert";
export const Type =  {
    isString(input) {
        return it("should be a string", () => {
            assert.equal(typeof input === "string", true);
        });
    },
    isNumber(input) {
        return it("should be a number", () => {
            assert.equal(typeof input === "number", true);
        })
    },
    isObject(input) {
        return it("should be an object", () => {
            assert.equal(typeof input === "object", true);
        });
    },
    isArray(input) {
        return it("should be an array", () => {
            assert.equal(typeof input === "object" && Array.isArray(input), true);
        });
    },
    isBoolean(input) {
        return it("should be a boolean with input = '" + input + "'", () => {
            assert.equal(typeof input === "boolean", true);
        });
    },
    isNull(input){
        return it("shoud be null", () => {
            assert.equal(input, null);
        });
    },
    isArrayOfString(input) {
        let isTrue = Array.isArray(input);
        if (isTrue) {
            let length = input.length;
            for (let i = 0; i < length; i++) {
                if (typeof input[i] !== "string") {
                    isTrue = false;
                    break;
                }
            }
        }
        return it("should be an array of string", () => {
            assert.equal(isTrue, true);
        });
    }
}