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
                    let jsons = [];
                    if(typeof value.__base__toJSON === "function"){
                        let jsonValue = value.__base__toJSON();
                        if(jsonValue) jsons.push(`${jsonValue}`);
                    }
                    // else if(Array.isArray(value)){
                    //     let jsonValue = Array.__base__toJSON(value);
                    //     jsons.push(`${jsonValue}`);
                    // }
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
                        Object.values(value).map((v, vIndex) => {
                            if(typeof v === "object") {
                                let key = parentKey ? `${parentKey}.${keys[vIndex]}` : `${keys[vIndex]}`;
                                if(!cache[key] && !Object.values(cache).includes(v)) cache[key] = v;
                            }
                        });
                        Object.values(value).map((v, vIndex) => {
                            if(typeof v === "object"){
                                let isCircular = false, root = cache["root"], circularKey: string = "root";
                                let delimiter = Object.__base__getDelimiter(keys[vIndex]);
                                if(parentKey){
                                    for(let i = 0; i < cacheKeyLength; i++){       
                                        if(cacheKeys[i] === "root" && v === root){
                                            isCircular = true;
                                            break;
                                        }
                                        else if(v === Object.__base__valueAt(root, cacheKeys[i], delimiter)){
                                            isCircular = true;
                                            circularKey += "." + cacheKeys[i];
                                            break;
                                        }
                                    }
                                }
                                if(!isCircular){
                                    let key = parentKey ? `${parentKey}.${keys[vIndex]}` : `${keys[vIndex]}`, jsonValue = JSON["__base___circularStringify"](v, cache, key);
                                    if(Array.isArray(value)) innerJSONs.push(`\"${jsonValue}\"`);   
                                    else innerJSONs.push(`\"${keys[vIndex]}\":${jsonValue}`);   
                                }
                                else {
                                    if(Array.isArray(value)) innerJSONs.push(`\"${JSON.__base__circularToken.toString()}[${circularKey}]\"`); 
                                    else innerJSONs.push(`\"${keys[vIndex]}\":\"${JSON.__base__circularToken.toString()}[${circularKey}]\"`); 
                                }
                            }
                            else {
                                let jsonValue = v;
                                if(typeof v === "string") jsonValue = `\"${jsonValue}\"`;
                                else if(typeof v === "function"){
                                    jsonValue = `{}`;
                                    // let funcString = v.toString();
                                    // let funcHead = funcString.match(/(function\s+\(.+\)|.*)/g)[0];
                                    // let funcBody = funcString.replace(funcHead, "");
                                    // funcBody = funcBody.replace("{", "");
                                    // let last = funcBody.lastIndexOf("}");
                                    // funcBody = funcBody.substring(0, last);
                                    // jsonValue = `[Function ${v.name},Head ${funcHead},Body ${funcBody.replace(/\n/g, "")}{{END_OF_FUNCTION_BODY}}]`;
                                }
                                innerJSONs.push(`\"${keys[vIndex]}\":${jsonValue}`);
                            }
                        });
                        if(Array.isArray(value)) jsons.push(`[${innerJSONs.join(",")}]`);
                        else jsons.push(`{${innerJSONs.join(",")}}`);
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
            let functions = []

            if(typeof value === "string"){
                // let functionJSONs = value.match(/Function .*,Head .*,Body .*[^({{END_OF_FUNCTION_BODY}})]/g) || [];
                // functionJSONs.map((functionJSON, i) => {
                //     let functionSegment = []
                //     let headIndex = functionJSON.indexOf(",Head");
                //     let bodyIndex = functionJSON.indexOf(",Body");
                //     functionSegment.push(
                //         functionJSON.substring(0, headIndex),
                //         functionJSON.substring((headIndex + 6), bodyIndex),
                //         functionJSON.substring((bodyIndex + 6), functionJSON.length)
                //     )
                //     functionSegment[0] = functionSegment[0].replace("Function ", "");
                //     functionSegment[1] = functionSegment[1].replace("function ", "").replace("(", "").replace(")", "");
                //     functionSegment[1] = functionSegment[1].replace(/\s/g, "");
                //     let newFunctionParams = functionSegment[1].split(",");
                //     newFunctionParams.push(functionSegment[2].replace("{{END_OF_FUNCTION_BODY}}]", ""));
                //     let func = new Function(newFunctionParams);
                //     Object.defineProperty(func, "name", {value: functionSegment[0]});
                //     let index = functions.push(func) - 1;
                //     value = value.replace("[" + functionJSON, `"functions[${index}]"`); 
                // });

                let specialJSONs = value.match(/[A-Za-z0-9]+\(.[^\)]*\)/g) || [];
                if(specialJSONs.length > 0){
                    specialJSONs.map((specialJSON, i) => {
                        let className = specialJSON.substring(0, specialJSON.indexOf("("));
                        let needToReplace = false;
                        if(global[className]){
                            if(global[className] && typeof global[className].__base__fromJSON === "function"){
                                specials.push(global[className].__base__fromJSON(specialJSON));
                                needToReplace = true;
                            }
                            else if(specialJSON !== circularToken){
                                specials.push(`"${specialJSON}`);
                                needToReplace = true;
                            }
                        }
                        else if(specialJSON !== circularToken){
                            specials.push(`"${specialJSON}`);
                            needToReplace = true;
                        }
                        if(needToReplace) {
                            value = value.replace(specialJSON, Symbol.for(`${parentKey ? parentKey : ""}${i}`).toString());
                        }
                    });
                }
                temp = JSON.parse(value);
            }
            else temp = value;
            if(!cache) {
                cache = {};
                cache["root"] = temp;
            }

            let keys = Object.keys(temp);
            let mappings = [];

            Object.values(temp).map((v, i) => {
                if(v){
                    if(typeof v === "object"){
                        let key = parentKey ? `${parentKey}.${keys[i]}` : `root.${keys[i]}`;
                        cache[key] = v;
                        mappings.push(keys[i]);
                        mappings.push(v);
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
            });
            let mappingLength = mappings.length;
            for(let i = 0; i < mappingLength; i += 2){
                let key = parentKey ? `${parentKey}.${mappings[i]}` : `root.${mappings[i]}`;
                temp[mappings[i]] = JSON["__base___circularParse"](mappings[i+1], cache, key);
            }
            // functions.map((f, fIndex) => {
                
            // });
            return temp;
        }
    });
    JSON.__base__circularParse = function<T>(value: string): T {
        let result = JSON["__base___circularParse"](value);
        return result;
    }
}