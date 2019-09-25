import { getProperties } from "@app/utilities/class";
import { PropertyType, PropertyTypeValue } from "@app/internal";

// function generateMappingSource(source, mappings: { [key : string]: string[]} = {}){
//     let mappingSource = {};
//     if(mappings && Object.keys(mappings).length > 0){
//         let keys = Object.keys(mappings);
//         let keyLength = keys.length;
//         let sourceKeys = Object.keys(source);
//     }
//     else{
//         mappingSource = source;
//     }
//     return mappingSource;
// }

function mapBasicType(source: any, type: PropertyTypeValue){
    if(!(source instanceof type)){
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

export function mapData<T>(ClassImp: { new(): T }, source: any, parentField: string = null): T {
    let properties = getProperties(ClassImp);
    let isValid = 1;
    let result = null;
    let missingFields = [];
    let mappingSource = {};
    
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
                                        result[property.name][index] = mapData(type.value as PropertyTypeValue, sourceValue, `${property.name}.${index}`); 
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
                            //         tempResult = mapData(propertyTypeValue, source[property.name], `${property.name}`);
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
                        if(isPropertyType){
                            let type = property.type as PropertyType;
                            if(type.type === "single"){
                                mappedValue = mapData(type.value as PropertyTypeValue, source[property.name], property.name);
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
                    Object.keys(source).map(key => {
                        result[key] = mapData(valueType, source[key], key);
                    });
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

export function assignData(source: any, excludes: string[] = []): any{
    let dest = null;
    if(typeof source !== "undefined"){
        if(Array.isArray(source)){
            dest = source.slice(0);
        }
        else if(typeof source === "object" && source !== null){
            if(typeof source.toString === "function"){
                let objectCanToString = source.toString();
                if(objectCanToString === "[object Object]"){
                    dest = {};
                    Object.keys(source).map(sourceKey => {
                        if(!excludes.includes(sourceKey)){
                            dest[sourceKey] = assignData(source[sourceKey], excludes);
                        }
                        else{
                            dest[sourceKey] = source[sourceKey];
                        }
                    });
                }
                else {
                    dest = source;
                }
            }
            else{
                dest = {};
                Object.keys(source).map(sourceKey => {
                    if(!excludes.includes(sourceKey)){
                        dest[sourceKey] = assignData(source[sourceKey], excludes);
                    }
                    else{
                        dest[sourceKey] = source[sourceKey];
                    }
                });
            }
        }
        else{
            dest = source;
        }
    }
    else{
        dest = undefined;
    }
    return dest;
}