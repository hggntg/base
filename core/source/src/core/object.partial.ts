if ("undefined" === typeof Object.replace) {
    Object.replace = function <T>(input: any, condition: any, replacer: any): T {
        let keys = Object.keys(input);
        Object.values(input).map((value, index) => {
            if (condition && typeof condition === "object") {
                if (value && typeof value === "object") {
                    if (JSON.circularStringify(value) === JSON.circularStringify(condition)) {
                        input[keys[index]] = replacer;
                    }
                    else {
                        input[keys[index]] = Object.replace(value, condition, replacer);
                    }
                }
            }
            else {
                if (value && typeof value === "object") {
                    input[keys[index]] = Object.replace(value, condition, replacer);
                }
                else if (value === condition) {
                    input[keys[index]] = replacer;
                }
            }
        });
        return input;
    }
}

if ("undefined" === typeof Object.clone) {
    Object.clone = function <T>(source: any): T {
        let dest;
        if (source) {
            if(typeof source === "object" && typeof source.clone === "function"){
                dest = source.clone();
            }
            else {
                dest = {};
                let keys = Object.keys(source);
                Object.values(source).map((value, index) => {
                    if (value && typeof value === "object") {
                        if (typeof value.toString === "function") {
                            if (value.toString() === "[object Object]") {
                                dest[keys[index]] = Object.clone(value);
                            }
                            else if (typeof (<any>value).clone === "function") {
                                dest[keys[index]] = (<any>value).clone();
                            }
                            else {
                                dest[keys[index]] = value;
                            }
                        }
                        else {
                            dest[keys[index]] = Object.clone(value);
                        }
                    }
                    else {
                        dest[keys[index]] = value;
                    }
                });
            }
        }
        else {
            dest = null;
        }
        return dest as T;
    }
} 

if ("undefined" === typeof Object.valueAt){
    Object.valueAt = function(source: any, key: string){
        let keys = key.split(".");
        let value;
        keys.map((k, i) => {
            if(i === 0) value = source[k];
            else value = value[k];
        });
        return value;
    }
}

if("undefined" === typeof Object.noMap){
    Object.noMap = function<V>(input: any): V{
        if(input){
            if(typeof input === "object" && !Array.isArray(input)){
                if(input instanceof Map){
                    let output = {};
                    input.forEach((value, key) => {
                        let keyString = "";
                        if(typeof key === "string"){
                            keyString = key;
                        }
                        else {
                            keyString = key.toString();
                        }
                        if(typeof value === "object" && !Array.isArray(value)){
                            output[keyString] = Object.noMap(value);
                        }
                        else{
                            if(Array.isArray(value)){
                                output[keyString] = value.slice(0);
                            }
                            else{
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
                        if(typeof value === "object" && !Array.isArray(value)) {
                            output[keys[index]] = Object.noMap(value);
                        }
                        else {
                            if(Array.isArray(value)){
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

if("undefined" === typeof Map.prototype.clone){
    Map.prototype.clone = function(this: Map<any, any>): Map<any, any>{
        let newMap = new Map();
        this.forEach((value, key) => {
            newMap.set(key, value);
        });
        return newMap;
    }
}

if("undefined" === typeof Map.fromObject){
    Map.fromObject = function<V>(obj: any): Map<keyof V, V[keyof V]> {
        const newMap = new Map();
        if(obj){
            let keys = Object.keys(obj);
            Object.values(obj).map((value, index) => {
                newMap.set(keys[index], value);
            });
            return newMap;
        }
        else {
            throw new Error("Can't convert null or undefined to Map");
        }
    }
}

if("undefined" === typeof Map.prototype.convertToObject){
    Map.prototype.convertToObject = function<V>(this: Map<keyof V, V[keyof V]>): V{
        let obj = {};
        this.forEach((value, key) => {
            let keyString = "";
            if(typeof key === "string"){
                keyString = key;
            }
            else {
                keyString = key.toString();
            }
            obj[keyString] = value;
        })
        return obj as V;
    };
}