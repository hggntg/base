// =================================================== Object =============================================
if ("undefined" === typeof Object.__base__replace) {
    Object.__base__replace = function <T>(input: any, condition: any, replacer: any): T {
        let keys = Object.keys(input);
        Object.values(input).map((value, index) => {
            if (condition && typeof condition === "object") {
                if (value && typeof value === "object") {
                    if (JSON.__base__circularStringify(value) === JSON.__base__circularStringify(condition)) input[keys[index]] = replacer;
                    else input[keys[index]] = Object.__base__replace(value, condition, replacer);
                }
            }
            else {
                if (value && typeof value === "object") input[keys[index]] = Object.__base__replace(value, condition, replacer);
                else if (value === condition) input[keys[index]] = replacer;
            }
        });
        return input;
    }
}
if ("undefined" === typeof Object.__base__clone) {
    Object.__base__clone = function <T>(source: any): T {
        let dest;
        if (source) {
            if (typeof source === "object" && typeof source.__base__clone === "function") dest = source.__base__clone();
            else if(Array.isArray(source)) dest = Array.__base__clone(source);
            else {
                dest = {};
                let keys = Object.keys(source);
                Object.values(source).map((value, index) => {
                    if (value && typeof value === "object") {
                        if(Array.isArray(value)) dest[keys[index]] = Array.__base__clone(value);
                        else dest[keys[index]] = Object.__base__clone(value);
                    }
                    else dest[keys[index]] = value;
                });
            }
        }
        else dest = null;
        return dest as T;
    }
}
if ("undefined" === typeof Object.__base__getDelimiter){
    Object.__base__getDelimiter = function(key: string){
        if(key && key.includes(".")) return "|";
        return ".";
    }
}
if ("undefined" === typeof Object.__base__valueAt) {
    Object.__base__valueAt = function <T>(source: any, key: string, delimiter: string = "."): T {
        if(!delimiter) delimiter = ".";
        let keys = key.split(delimiter), value;
        keys.map((k, i) => {
            if (i === 0) value = source[k];
            else value = value[k];
        });
        return value as T;
    }
}
if ("undefined" === typeof Object.__base__setAt) {
    Object.__base__setAt = function (source: any, key: string | number, value: any, delimiter: string = ".") {
        if(!delimiter) delimiter = ".";
        let keys = typeof key === "string" ? key.split(delimiter) : [key as number];
        if (keys.length === 1) {
            let innerKey: string | number = keys[0];
            innerKey = Number(innerKey);
            if(isNaN(innerKey)) innerKey = keys[0];
            source[innerKey] = value;
        }
        else {
            let innerKey = keys[0];
            keys.splice(0, 1);
            source[innerKey] = Object.__base__setAt(source[innerKey], keys.join(delimiter), value);
        }
    }
}
if ("undefined" === typeof Object.__base__flattenMap) {
    Object.__base__flattenMap = function <V>(input: any): V {
        if (input) {
            if (typeof input === "object" && !Array.isArray(input)) {
                if (input instanceof Map) {
                    let output = {};
                    input.forEach((value, key) => {
                        let keyString = "";
                        if (typeof key === "string") {
                            keyString = key;
                        }
                        else {
                            keyString = key.toString();
                        }
                        if (typeof value === "object" && !Array.isArray(value)) {
                            output[keyString] = Object.__base__flattenMap(value);
                        }
                        else {
                            if (Array.isArray(value)) {
                                output[keyString] = value.slice(0);
                            }
                            else {
                                output[keyString] = value;
                            }
                        }
                    });
                    return output as any;
                }
                else {
                    let output = {};
                    let keys = Object.keys(input);
                    Object.values(input).map((value, index) => {
                        if (typeof value === "object" && !Array.isArray(value)) {
                            output[keys[index]] = Object.__base__flattenMap(value);
                        }
                        else {
                            if (Array.isArray(value)) {
                                output[keys[index]] = value.slice(0);
                            }
                            else {
                                output[keys[index]] = value;
                            }
                        }
                    })
                    return output as any;
                }
            }
            else {
                throw new Error("Input must be an object or map");
            }
        }
        else {
            throw new Error("Can't convert null or undefined to object");
        }
    }
}

// =================================================== Array =============================================
if ("undefined" === typeof Array.__base__clone) {
    Array.__base__clone = function<T>(this: ArrayConstructor, source: Array<T>): Array<T> {
        let temp = source.slice(0);
        return temp.map(t => {
            if (typeof t === "object") {
                if(Array.isArray(t)) return Array.__base__clone(t) as any;
                else return Object.__base__clone(t);
            }
            else return t;
        });
    }
}
if ("undefined" === typeof Array.__base__toJSON) {
    Array.__base__toJSON = function<T>(this:  ArrayConstructor, source: Array<T>): string {
        let jsons = [];
        source.map(v => {
            if (typeof v === "object") jsons.push(JSON.__base__circularStringify(v));
            else if (typeof v !== "function") jsons.push((typeof v === "string" ? `"${v}"` : v.toString()));
        });
        let jsonString = `[${jsons.join(",")}]`;
        return jsonString;
    }
}
// =================================================== RegExp =============================================
if ("undefined" === typeof RegExp.prototype.__base__clone){
    RegExp.prototype.__base__clone = function(this: RegExp): RegExp {
        return new RegExp(this);
    }
}
// if ("undefined" === typeof RegExp.prototype.__base__toJSON){
//     RegExp.prototype.__base__toJSON = function(this: RegExp): string {
//         this.
//     }
// }