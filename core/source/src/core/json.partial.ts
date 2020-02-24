if("undefined" === typeof JSON.circularToken){
    JSON.circularToken = Symbol.for("Circular");
}

if("undefined" === typeof JSON.circularStringify){
    Object.defineProperty(JSON, "_circularStringify", {
        writable: false,
        configurable: false,
        value: function(value: any, cache?: any, parentKey?: string | number){
            if(!cache){
                cache = {};
                cache["root"] = value;
            }
            if(parentKey){
                cache[parentKey] = value;
            }
            let jsonString;
            if(value){
                let keys = Object.keys(value);
                let cacheKeys = Object.keys(cache);
                let cacheKeyLength = cacheKeys.length;
                jsonString = "{";
                Object.values(value).map((v, i) => {
                    if(typeof v === "object"){
                        let isCircular = false;
                        let root = cache["root"];
                        let circularKey: string = "root";
                        for(let i = 0; i < cacheKeyLength - 1; i++){
                            if(cacheKeys[i] === "root"){
                                if(v === root){
                                    isCircular = true;
                                    break;
                                }
                            }
                            else {
                                if(parentKey && parentKey.toString().indexOf(cacheKeys[i]) === 0 && v === Object.valueAt(root, cacheKeys[i])){
                                    isCircular = true;
                                    circularKey += "." + cacheKeys[i];
                                    break;
                                }
                            }
                        }
                        if(!isCircular){
                            let key = parentKey ? `${parentKey}.${keys[i]}` : `${keys[i]}`;
                            let jsonValue = JSON["_circularStringify"](v, cache, key);
                            jsonString += `\"${keys[i]}\":${jsonValue},`;   
                        }
                        else {
                            jsonString += `\"${keys[i]}\":\"${JSON.circularToken.toString()}[${circularKey}]\",`; 
                        } 
                    }
                    else {
                        let jsonValue = v;
                        if(typeof v !== "number" && typeof v !== "boolean"){
                            jsonValue = `\"${jsonValue}\"`;
                        }
                        jsonString += `\"${keys[i]}\":${jsonValue},`;
                    }
                });
                if(jsonString.lastIndexOf(",") === jsonString.length - 1){
                    jsonString = jsonString.substring(0, jsonString.length - 1);
                }
                jsonString += "}";
            }
            else {
                jsonString = "null";
            }
            return jsonString;
        }
    });
    JSON.circularStringify = function(value: any): string{
        return JSON["_circularStringify"](value);
    }
}

if("undefined" === typeof JSON.circularParse){
    Object.defineProperty(JSON, "_circularParse", {
        writable: false,
        configurable: false,
        value: function(value: any, cache?: any, parentKey?: string | number){
            let circularToken = JSON.circularToken.toString();
            let temp = typeof value === "string" ? JSON.parse(value) : value;
            if(!cache) {
                cache = {};
                cache["root"] = temp;
            }
            else cache[parentKey] = temp;
            let keys = Object.keys(temp);
            Object.values(temp).map((v, i) => {
                if(v){
                    if(typeof v === "object"){
                        let key = parentKey ? `${parentKey}.${keys[i]}` : `root.${keys[i]}`;
                        temp[keys[i]] = JSON["_circularParse"](v, cache, key);
                    }
                    else if(typeof v === "string" && v.indexOf(circularToken) === 0) {
                        let key = v.replace(circularToken, "").replace(/[\[\]]/g, "");
                        temp[keys[i]] = Object.valueAt(cache, key);
                    }
                }
            });
            return temp;
        }
    });
    JSON.circularParse = function<T>(value: string): T {
        let result = JSON["_circularParse"](value);
        return result;
    }
}