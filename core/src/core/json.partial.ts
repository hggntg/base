if("undefined" === typeof JSON.__base__circularToken) JSON.__base__circularToken = Symbol.for("Circular");
if("undefined" === typeof JSON.__base__circularStringify){
    Object.defineProperty(JSON, "__base___circularStringify", {
        writable: false,
        configurable: false,
        value: function(value: any, cache?: any, parentKey?: string | number){
            let jsonString = "";
            if(value !== undefined && value !== null){
                if(typeof value === "object"){
                    if(!cache){
                        cache = {};
                        cache["root"] = value;
                    }
                    if(parentKey) cache[parentKey] = value;
                    let jsons = [];
                    if(typeof value.__base__toJSON === "function"){
                        let jsonValue = value.__base__toJSON();
                        if(jsonValue) jsons.push(`${jsonValue}`);
                    }
                    else if(Array.isArray(value)){
                        let jsonValue = Array.__base__toJSON(value);
                        jsons.push(`${jsonValue}`);
                    }
                    else if(typeof value.toJSON === "function"){
                        let jsonValue = value.toJSON();
                        if(jsonValue) jsons.push(`${jsonValue}`);
                    }
                    else if(typeof value.toString === "function" && value.toString().indexOf("[object") !== 0){
                        let jsonValue = value.toString();
                        if(jsonValue) jsons.push(`${jsonValue}`);
                    }
                    else {
                        let keys = Object.keys(value), cacheKeys = Object.keys(cache), cacheKeyLength = cacheKeys.length;
                        let innerJSONs = [];
                        Object.values(value).map((v, i) => {
                            if(typeof v === "object"){
                                let isCircular = false, root = cache["root"], circularKey: string = "root";
                                let delimiter = Object.__base__getDelimiter(cacheKeys[i]);
                                for(let i = 0; i < cacheKeyLength - 1; i++){
                                    if(cacheKeys[i] === "root" && v === root){
                                        isCircular = true;
                                        break;
                                    }
                                    else if(parentKey && parentKey.toString().indexOf(cacheKeys[i]) === 0 && v === Object.__base__valueAt(root, cacheKeys[i], delimiter)){
                                        isCircular = true;
                                        circularKey += "." + cacheKeys[i];
                                        break;
                                    }
                                }
                                if(!isCircular){
                                    let key = parentKey ? `${parentKey}.${keys[i]}` : `${keys[i]}`, jsonValue = JSON["__base___circularStringify"](v, cache, key);
                                    if(Array.isArray(value)) innerJSONs.push(`\"${jsonValue}"`);   
                                    else innerJSONs.push(`\"${keys[i]}\":${jsonValue}`);   
                                }
                                else innerJSONs.push(`\"${keys[i]}\":\"${JSON.__base__circularToken.toString()}[${circularKey}]\"`); 
                            }
                            else {
                                let jsonValue = v;
                                if(typeof v === "string") jsonValue = `\"${jsonValue}\"`;
                                innerJSONs.push(`\"${keys[i]}\":${jsonValue}`);
                            }
                        });
                        jsons.push(`{${innerJSONs.join(",")}}`);
                    }
                    jsonString = `${jsons.join(",")}`;
                }
                else if(typeof value !== "function"){
                    jsonString = value.toString();
                }
            }
            else {
                if(typeof value === "undefined") jsonString = "undefined";
                else jsonString = "null";
            }
            return jsonString;
        }
    });
    JSON.__base__circularStringify = function(value: any): string{
        return JSON["__base___circularStringify"](value);
    }
}
if("undefined" === typeof JSON.__base__circularParse){
    Object.defineProperty(JSON, "__base___circularParse", {
        writable: false,
        configurable: false,
        value: function(value: any, cache?: any, parentKey?: string | number){
            let circularToken = JSON.__base__circularToken.toString();
            let temp;
            let specials = [];
            if(typeof value === "string"){
                let specialJSONs = value.match(/[A-Za-z0-9]+\(.[^\)]*\)/g) || [];
                if(specialJSONs.length > 0){
                    specialJSONs.map((specialJSON, i) => {
                        let className = specialJSON.substring(0, specialJSON.indexOf("("));
                        if(global[className]){
                            if(global[className] && typeof global[className].__base__fromJSON === "function"){
                                specials.push(global[className].__base__fromJSON(specialJSON));
                            }
                            else {
                                specials.push(`"${specialJSON}`);
                            }
                        }
                        else {
                            specials.push(`"${specialJSON}`);
                        }
                        value = value.replace(specialJSON,`"` + Symbol.for(`${parentKey ? parentKey : ""}${i}`).toString() + `"`);
                    });
                }
                system.log(value);
                temp = JSON.parse(value);
            }
            else temp = value;

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
                        temp[keys[i]] = JSON["__base___circularParse"](v, cache, key);
                    }
                    else if(typeof v === "string" && v.indexOf(circularToken) === 0) {
                        let key = v.replace(circularToken, "").replace(/[\[\]]/g, "");
                        let delimiter = Object.__base__getDelimiter(key);
                        temp[keys[i]] = Object.__base__valueAt(cache, key, delimiter);
                    }
                }
            });
            specials.map((special, i) => {
                Object.__base__replace(temp, Symbol.for((parentKey ? parentKey : "") + i.toString()).toString(), special);
            })
            return temp;
        }
    });
    JSON.__base__circularParse = function<T>(value: string): T {
        let result = JSON["__base___circularParse"](value);
        return result;
    }
}