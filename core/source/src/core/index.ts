import { join } from "path";
import BuiltInModule from "module";
import "./injection";
import "./property";
import "./class";
import "./namespace";
import "./logger";
import "./error";
import "./watcher";
import "./json.partial";
import "./object.partial";



if ("undefined" === typeof global["addAlias"]) {
    const Module = module.constructor || BuiltInModule;
    const moduleAliasNames = [];
    const moduleAliases = {

    };

    global["addAlias"] = function addAlias(alias: string, target: string) {
        moduleAliases[alias] = target;
        if (!moduleAliasNames.includes(alias)) moduleAliasNames.push(alias);
    }

    global["isPathMatchesAlias"] = function isPathMatchesAlias(path: string, alias: string) {
        if (path.indexOf(alias) === 0) {
            if (path.length === alias.length) return true
            if (path[alias.length] === '/') return true
        }

        return false
    }

    const oldResolveFilename = (<any>Module)._resolveFilename;
    (<any>Module)._resolveFilename = function (request, parentModule, isMain, options) {
        for (var i = moduleAliasNames.length; i-- > 0;) {
            var alias = moduleAliasNames[i];
            if (isPathMatchesAlias(request, alias)) {
                var aliasTarget = moduleAliases[alias];
                if (typeof moduleAliases[alias] === 'function') {
                    let fromPath = parentModule.filename;
                    aliasTarget = moduleAliases[alias](fromPath, request, alias);
                    if (!aliasTarget || typeof aliasTarget !== 'string') {
                        throw new Error('[module-alias] Expecting custom handler function to return path.');
                    }
                }
                request = join(aliasTarget, request.substr(alias.length));
                break;
            }
        }
        return oldResolveFilename.call(this, request, parentModule, isMain, options)
    }
}

if("undefined" === typeof global["mapBasicType"]){
    global["mapBasicType"] = function mapBasicType(source: any, type: PropertyTypeValue){
        if(type){
            if(!(source instanceof type)){
                type = type as PropertyTypeValue;
                if(type.name === "Boolean"){
                    if(typeof source !== "undefined"){
                        if(source === "true" || source === true) source = true;
                        else if(source === "false" || source === false) source = false;
                        else source = undefined;
                    }
                }
                else if(type.name === "String"){
                    if(typeof source !== "undefined"){
                        source = source.toString();
                    }
                }
                else if(type.name === "Number"){
                    if(typeof source !== "undefined"){
                        try{
                            source = Number(source);
                        }
                        catch(e){
                            source = undefined;
                        }
                    }
                }
                else if(type.name === "Date"){
                    if(typeof source !== "undefined"){
                        try{
                            source = new Date(source);
                        }
                        catch(e){
                            source = undefined;
                        }
                    }
                }
                return source;
            }
            else {
                return source;
            }
        }
        else {
            console.warn("Param type not found or not an object, type is " + typeof type);
            return source;
        }
    }
}

if("undefined" === typeof global["defaultValue"]){
    global["defaultValue"] = function defaultValue(input: any, type: "boolean" | "string" | "number" | "object" | "array", truthy: boolean = true) {
        if (input === null) {
            if (type === "boolean") {
                return truthy;
            }
            else if (type === "string") {
                return "";
            }
            else if (type === "number") {
                return truthy ? 1 : 0;
            }
            else if (type === "object") {
                return truthy ? {} : null;
            }
        }
        else {
            if(type === "array" && Array.isArray(input)){
                return input;
            }
            else if (typeof input === type && !Array.isArray(input)) {
                return input;
            }
            else {
                return null;
            }
        }
    }
}

if("undefined" === typeof global["mapData"]){
    global["mapData"] = function mapData<T>(ClassImp: { new(): T }, inputSource: any, parentField: string = null): T {
        let properties = getProperties(ClassImp);
        let isValid = 1;
        let result = null;
        let missingFields = [];
        let mappingSource = {};
        let source = Object.clone(inputSource);
        properties.map(property => {
            if (property.required === false || (property.required && property.name === "$_all" && source && Object.keys(source).length > 0) || (property.required && source && source[property.name])) {
                isValid *= 1;
            }
            else {
                if(property.name === "$_all"){
                    if(parentField) missingFields.push(`${parentField}`);
                }
                else {
                    if(parentField) missingFields.push(`${parentField}.${property.name}`);
                    else missingFields.push(property.name);   
                }
                isValid *= 0;
            }
            if (isValid) {
                if (!result) {
                    result = new ClassImp();
                }
                if(source){
                    if(property.name !== "$_all"){
                        let isPropertyType = property.type && (<any>property.type).type && (<any>property.type).value;
                        if (Array.isArray(source[property.name])) {
                            if(isPropertyType){
                                let type = property.type as PropertyType;
                                if(type.type === "single") {
                                    result[property.name] = source[property.name].slice(0);
                                }
                                else if(type.type === "list"){
                                    result[property.name] = [];
                                    source[property.name].map((sourceValue, index) => {
                                        if(typeof sourceValue === "object") {
                                            if((<any>type.value).name === "Object"){
                                                result[property.name][index] = sourceValue;
                                            }
                                            else {
                                                result[property.name][index] = mapData(type.value as PropertyTypeValue, sourceValue, `${property.name}.${index}`); 
                                            }
                                        }
                                        else {
                                            result[property.name][index] = mapBasicType(sourceValue, type.value as PropertyTypeValue);
                                        }
                                    });
                                }
                                // else {
                                //     result[property.name] = [];
                                //     let propertyTypeValues = type.value as PropertyTypeValue[];
                                //     let propertyTypeValueLength = propertyTypeValues.length;
                                //     let tempResult = undefined;
                                //     for(let i = 0; i < propertyTypeValueLength; i++){
                                //         let propertyTypeValue = propertyTypeValues[i];
                                //         tempResult = mapData(propertyTypeValue, source[property.name], \`\${property.name}\`);
                                //         if(tempResult){
                                //             break;
                                //         }
                                //     }
                                //     result[property.name] = tempResult;
                                // }
                            }
                            else{
                                result[property.name] = source[property.name].slice(0);
                            }
                        }
                        else if (typeof source[property.name] === "object") {
                            let mappedValue = undefined;
                            if(source[property.name] instanceof Map){
                                source[property.name] = (<Map<any, any>>source[property.name]).convertToObject();
                            }
                            if(isPropertyType){
                                let type = property.type as PropertyType;
                                if(type.type === "single"){
                                    mappedValue = mapData(type.value as PropertyTypeValue, source[property.name], property.name);
                                }
                                else if(type.type === "map"){
                                    mappedValue = Map.fromObject(source[property.name]);
                                }
                                else if(type.type === "literal"){
                                    let propertyTypeValues = type.value as PropertyTypeValue[];
                                    let propertyTypeValueLength = propertyTypeValues.length; 
                                    for(let i = 0; i < propertyTypeValueLength; i++){
                                        let propertyTypeValue = propertyTypeValues[i];
                                        if(propertyTypeValue.name === "Boolean" || propertyTypeValue.name === "String" || propertyTypeValue.name === "Number" || propertyTypeValue.name === "Date"){
                                            mappedValue = mapBasicType(source[property.name], propertyTypeValue);
                                        }
                                        else{
                                            mappedValue = mapData(propertyTypeValue, source[property.name], property.name);
                                            Object.keys(mappedValue).map(key => {
                                                if(typeof mappedValue[key] === "undefined"){
                                                    delete mappedValue[key];
                                                }
                                            });
                                            if(Object.keys(mappedValue).length === 0){
                                                mappedValue = undefined;
                                            }
                                        }
                                        if(mappedValue){
                                            break;
                                        }
                                    }
                                }
                                else{
                                    mappedValue = undefined;
                                }
                            }
                            if(!mappedValue){
                                mappedValue = source[property.name];
                            }
                            result[property.name] = mappedValue;
                        }
                        else {
                            let sourceValue = source[property.name];
                            if(Array.isArray(property.type)){
                                let sourceValueType = typeof sourceValue;
                                if(!property.type.includes(sourceValueType)){
                                    sourceValue = undefined;
                                }
                            }
                            else{
                                let type = property.type as PropertyType;
                                if(type.type === "single"){
                                    let singleType = type.value as PropertyTypeValue;
                                    sourceValue = mapBasicType(sourceValue, singleType);
                                }
                                else if(type.type === "literal"){
                                    let propertyTypeValues = type.value as PropertyTypeValue[];
                                    let propertyTypeValueLength = propertyTypeValues.length;
                                    let tempValue = undefined;
                                    for(let i = 0; i < propertyTypeValueLength; i++){
                                        let propertyTypeValue = propertyTypeValues[i];
                                        if(propertyTypeValue.name === "Boolean" || propertyTypeValue.name === "String" || propertyTypeValue.name === "Number" || propertyTypeValue.name === "Date"){
                                            tempValue = mapBasicType(sourceValue, propertyTypeValue);
                                            if(tempValue){
                                                break;
                                            }
                                        }
                                    }
                                    sourceValue = tempValue;
                                }
                                else{
                                    sourceValue = undefined;
                                }
                            }
                            result[property.name] = sourceValue;
                        }
                    }
                    else {
                        let type = property.type as PropertyType;
                        let valueType = type.value as PropertyTypeValue;
                        if(type.type === "literal"){
                            let propertyTypeValues = type.value as PropertyTypeValue[];
                            let propertyTypeValueLength = propertyTypeValues.length;
                            Object.keys(source).map(key => {
                                let tempValue = undefined;
                                for(let i = 0; i < propertyTypeValueLength; i++){
                                    let propertyTypeValue = propertyTypeValues[i];
                                    if(propertyTypeValue.name === "Boolean" || propertyTypeValue.name === "String" || propertyTypeValue.name === "Number" || propertyTypeValue.name === "Object" || propertyTypeValue.name === "Date"){
                                        tempValue = mapBasicType(source[key], propertyTypeValue);
                                        if(tempValue){
                                            break;
                                        }
                                    }
                                }
                                result[key] = tempValue;
                            });
                        }
                        else {
                            Object.keys(source).map(key => {
                                if(typeof source[key] === "object"){
                                    result[key] = mapData(valueType, source[key], key);
                                }
                                else {
                                    result[key] = mapBasicType(source[key], valueType);
                                }
                            });
                        }
                    }
                }
                else{
                    if(property.name !== "$_all"){
                        result[property.name] = undefined;
                    }
                }
            }
        });
        if (isValid) {
            return result as T;
        }
        else {
            throw new Error("Missing fields " + missingFields.join(", "));
        }
    }
}