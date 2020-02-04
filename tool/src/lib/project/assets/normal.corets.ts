export const corets=`import "reflect-metadata";
import { join } from "path";
import { EventEmitter } from "events";
import BuiltInModule from "module";
import { injectable, Container } from "inversify";
import * as asyncHooks from "async_hooks";

if("undefined" === typeof JSON.circularStringify){
    JSON.circularStringify = function(value: any): string{
        let cache = [];
        let jsonString = JSON.stringify(value, function(key, innerValue) {
            if (typeof innerValue === 'object' && innerValue !== null) {
                if (cache.indexOf(innerValue) !== -1) {
                    return;
                }
                cache.push(innerValue);
            }
            return innerValue;
        });
        cache = null;
        return jsonString;
    }
}

if("undefined" === typeof Map.fromObject){
    Map.fromObject = function<V>(obj: any): Map<string, V> {
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

if("undefined" === typeof Map.prototype.convertToObject){
    Map.prototype.convertToObject = function(this: Map<any, any>){
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
        return obj;
    };
}

if ("undefined" === typeof global["getClass"]) {
    global["getClass"] = function getClass(target: any): { new(...args: any[]): any } {
        if (target) {
            if (typeof target === "object" && typeof target.constructor === "function") {
                return target.constructor;
            }
            else {
                return target;
            }
        }
        else {
            throw new Error("Error target is undefined cannot identify a class");
        }
    }
}

if ("undefined" === typeof global["getMetadata"]) {
    global["getMetadata"] = function getMetadata<T>(key: string | Symbol, target: any) {
        return Reflect.getMetadata(key, getClass(target)) as T;
    }
}

if ("undefined" === typeof global["defineMetadata"]) {
    global["defineMetadata"] = function defineMetadata(key: string | Symbol, value: any, target: any) {
        return Reflect.defineMetadata(key, value, getClass(target));
    }
}


const typeKey = "Type";
const PROPERTIES_KEY = Symbol.for("property");
const CLASS_KEY = Symbol.for("class");
const REAL_DATA_TYPE_KEY = Symbol.for("real-data-type");

if("undefined" === typeof global["BaseError"]){
    class BaseError extends Error implements IBaseError{
        code: number;
        specificCode: number;
        name: string;
        message: string;
        stack?: string;
        constructor(_code: number, _specificCode: number, _name: string, _message: string){
            super(_message);
            this.code = _code;
            this.specificCode = _specificCode;
            this.name = _name;
        }
        toString(){
            return \`\${this.code} - \${this.specificCode} - \${this.name} : \${this.message} \\n \${this.stack}\`;
        }
    }
    global["BaseError"] = BaseError;
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

if("undefined" === typeof global["mapData"]){
    global["mapData"] = function mapData<T>(ClassImp: { new(): T }, inputSource: any, parentField: string = null): T {
        let properties = getProperties(ClassImp);
        let isValid = 1;
        let result = null;
        let missingFields = [];
        let mappingSource = {};
        let source = assignData(inputSource);
        properties.map(property => {
            if (property.required === false || (property.required && property.name === "$_all" && source && Object.keys(source).length > 0) || (property.required && source && source[property.name])) {
                isValid *= 1;
            }
            else {
                if(property.name === "$_all"){
                    if(parentField) missingFields.push(\`\${parentField}\`);
                }
                else {
                    if(parentField) missingFields.push(\`\${parentField}.\${property.name}\`);
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
                                                result[property.name][index] = mapData(type.value as PropertyTypeValue, sourceValue, \`\${property.name}.\${index}\`); 
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

if("undefined" === typeof global["assignData"]){
    global["assignData"] = function assignData(source: any, excludes: string[] = []): any{
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
                    else if(objectCanToString === "[object Map]"){
                        let temp = (<Map<any, any>>source).convertToObject();
                        dest = Map.fromObject(temp);
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

if ("undefined" === typeof global["DynamicProperty"]) {
    global["DynamicProperty"] = function DynamicProperty(type: { new(...args: any[]): any } | PropertyType, options?: {
        required?: boolean
    }) {
        return (target: any) => {
            let columns: IProperty[] = getMetadata(PROPERTIES_KEY, target) || [];
            let realDataType = getRealDataType(type);
            if (realDataType) {
                columns.push({ type: realDataType, name: "$all", required: (options && options.required) ? true : false });
            }
            else {
                let isPropertyType = type && (<any>type).type && (<any>type).value;
                let realType: PropertyType
                if (isPropertyType) {
                    realType = type as PropertyType;
                }
                else {
                    realType = {
                        type: "single",
                        value: type as { new(...args: any[]): any }
                    }
                }
                columns.push({ type: realType, name: "$_all", required: (options && options.required) ? true : false });
            }
            defineMetadata(PROPERTIES_KEY, columns, target);
        }
    }
}

if ("undefined" === typeof global["PropertyArray"]) {
    global["PropertyArray"] = function PropertyArray(type: { new(...args: any[]): any }): PropertyType {
        return {
            type: "list",
            value: type
        } as PropertyType
    }
}

if ("undefined" === typeof global["PropertyMap"]) {
    global["PropertyMap"] = function PropertyMap(type: { new(...args: any[]): any }): PropertyType {
        return {
            type: "map",
            value: type
        } as PropertyType;
    }
}

if ("undefined" === typeof global["PropertyLiteral"]) {
    global["PropertyLiteral"] = function PropertyLiteral(type: { new(...args: any[]): any }, ...moreType: ({ new(...args: any[]): any })[]) {
        moreType.push(type);
        let literalProperty: PropertyType = {
            type: "literal",
            value: []
        }
        moreType.map(type => {
            (<PropertyTypeValue[]>literalProperty.value).push(type);
        });
        return literalProperty;
    }
}

if ("undefined" === typeof global["Property"]) {
    global["Property"] = function Property(type: { new(...args: any[]): any } | PropertyType, options?: {
        required?: boolean
    }) {
        return (target: object, propertyKey: string) => {
            let columns: IProperty[] = getMetadata(PROPERTIES_KEY, target) || [];
            let realDataType = getRealDataType(type);
            if (realDataType) {
                columns.push({ type: realDataType, name: propertyKey, required: (options && options.required) ? true : false });
            }
            else {
                let isPropertyType = type && (<any>type).type && (<any>type).value;
                let realType: PropertyType
                if (isPropertyType) {
                    realType = type as PropertyType;
                }
                else {
                    realType = {
                        type: "single",
                        value: type as { new(...args: any[]): any }
                    }
                }
                columns.push({ type: realType, name: propertyKey, required: (options && options.required) ? true : false });
            }
            defineMetadata(PROPERTIES_KEY, columns, target);
        }
    }
}

if ("undefined" === typeof global["defineRealDataType"]) {
    global["defineRealDataType"] = function defineRealDataType(target, type: "object" | "string" | "boolean" | "number") {
        let types: string[] = getRealDataType(target) || [];
        if (!types.includes(type)) types.push(type);
        defineMetadata(REAL_DATA_TYPE_KEY, types, getClass(target));
    }
}

if ("undefined" === typeof global["getRealDataType"]) {
    global["getRealDataType"] = function getRealDataType(target): string[] {
        let realDataType = undefined;
        try {
            realDataType = getMetadata(REAL_DATA_TYPE_KEY, target) as string[];
        }
        catch (e) {
            realDataType = undefined;
        }
        return realDataType;
    }
}

if ("undefined" === typeof global["getProperties"]) {
    global["getProperties"] = function getProperties(target: any): IProperty[] {
        let properties = getMetadata<IProperty[]>(PROPERTIES_KEY, target);
        return properties || [];
    }
}

if ("undefined" === typeof global["generateNewableIdentifier"]) {
    global["generateNewableIdentifier"] = function generateNewableIdentifier(identifier: symbol | string) {
        let newableIdentifier: symbol | string = null;
        if (typeof identifier === "string") {
            newableIdentifier = \`Newable<\${identifier}>\`;
        }
        else {
            let symbolString = identifier.toString().replace("Symbol(", "").replace(")", "");
            newableIdentifier = Symbol.for(\`Newable<\${symbolString}>\`);
        }
        return newableIdentifier;
    }
}

if ("undefined" === typeof global["bindToContainer"]) {
    global["bindToContainer"] = function bindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        if (isDefault) {
            container.bind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
            if (newable) {
                container.bind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
            }
        }
        else {
            container.bind<T>(identifier).to(service).inSingletonScope().whenTargetNamed(service.name);
            if (newable) {
                container.bind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetNamed(service.name);
            }
        }
    }
}

if ("undefined" === typeof global["bindConstantToContainer"]) {
    global["bindConstantToContainer"] = function bindConstantToContainer<T>(container: Container, identifier: symbol | string, constantValue: T, name?: string) {
        if (!name) {
            container.bind<T>(identifier).toConstantValue(constantValue);
        }
        else {
            container.bind<T>(identifier).toConstantValue(constantValue).whenTargetNamed(name);
        }
    }
}

if ("undefined" === typeof global["rebindToContainer"]) {
    global["rebindToContainer"] = function rebindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        let allBinders = container.getAll(identifier);
        let reBinders = [];
        allBinders.map((binder) => {
            let binderContructor = Object.getPrototypeOf(binder).constructor;
            if (isDefault || (!isDefault && service.name !== binderContructor.name)) {
                reBinders.push(binderContructor);
            }
        });

        if (isDefault) {
            container.rebind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
        }
        else {
            container.rebind<T>(identifier).to(service).inSingletonScope().whenTargetNamed(service.name);
        }

        reBinders.map((binderClass) => {
            container.bind<T>(identifier).to(binderClass).inSingletonScope().whenTargetNamed(binderClass.name);
        });

        if (newable) {
            let allNewableBinders = container.getAll(generateNewableIdentifier(identifier));
            let reNewableBinders = [];
            allNewableBinders.map((newableBinder) => {
                let binderContructor = Object.getPrototypeOf(newableBinder).constructor;
                if (isDefault || (!isDefault && service.name !== binderContructor.name)) {
                    reNewableBinders.push(binderContructor);
                }
            });

            if (isDefault) {
                container.rebind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
            }
            else {
                container.rebind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetNamed(service.name);
            }

            reNewableBinders.map((newBinderClass) => {
                container.bind<T>(generateNewableIdentifier(identifier)).to(newBinderClass).inTransientScope().whenTargetNamed(newBinderClass.name);
            });
        }
    }
}

if ("undefined" === typeof global["registerDependency"]) {
    global["registerDependency"] = function registerDependency<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        let container: Container = getMetadata("DI", global);
        if (!container) {
            container = new Container();
        }
        if (isDefault) {
            try {
                container.get(identifier);
                rebindToContainer<T>(container, identifier, service, newable, isDefault);
            }
            catch (e) {
                bindToContainer<T>(container, identifier, service, newable, isDefault);
            }
        }
        else {
            bindToContainer<T>(container, identifier, service, newable, isDefault);
        }
        defineMetadata("DI", container, global);
    }

}

if ("undefined" === typeof global["registerDependencyAgain"]) {
    global["registerDependencyAgain"] = function registerDependencyAgain<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        let container: Container = getMetadata("DI", global);
        if (!container) {
            container = new Container();
        }
        rebindToContainer<T>(container, identifier, service, newable, isDefault);
        defineMetadata("DI", container, global);
    }
}

if ("undefined" === typeof global["registerConstant"]) {
    global["registerConstant"] = function registerConstant<T>(identifier: symbol | string, constantValue: T, name?: string) {
        let container: Container = getMetadata("DI", global);
        if (!container) {
            container = new Container();
        }
        return bindConstantToContainer(container, identifier, constantValue, name);
    }
}

// export function getDependency<T>(identifier: symbol | string): T;
// export function getDependency<T>(identifier: symbol | string, name: string): T;
// export function getDependency<T>(identifier: symbol | string, newable: boolean): T;
// export function getDependency<T>(identifier: symbol | string, name: string, newable: boolean): T;
// export function getDependency<T>(identifier: symbol | string, newable: boolean, name: string): T;
if ("undefined" === typeof global["getDependency"]) {
    global["getDependency"] = function getDependency<T>(identifier: symbol | string, arg0?: string | boolean, arg1?: string | boolean): T {
        let numOfArgs = arguments.length;
        let container: Container = getMetadata("DI", global);
        if (!container) {
            throw new Error("DI Container is not exists");
        }
        else {
            let name: string = null;
            let newable: boolean = false;
            if (numOfArgs === 2) {
                if (typeof arg0 === "string") {
                    name = arg0;
                }
                else {
                    newable = arg0;
                }
            }
            else {
                if (typeof arg0 === "string") {
                    name = arg0;
                }
                else {
                    newable = arg0;
                }
                if (typeof arg1 === "string") {
                    name = arg1;
                }
                else {
                    newable = arg1;
                }
            }
            if (name) {
                if (newable) {
                    return container.getNamed(generateNewableIdentifier(identifier), name);
                }
                else {
                    return container.getNamed(identifier, name);
                }
            }
            else {
                if (newable) {
                    return container.get(generateNewableIdentifier(identifier));
                }
                else {
                    return container.get(identifier);
                }
            }
        }
    }
}

if ("undefined" === typeof global["getConstatnt"]) {
    global["getConstant"] = function getConstant<T>(identifier: symbol | string, name?: string): T {
        let container: Container = getMetadata("DI", global);
        if (!container) {
            throw new Error("DI Container is not exists");
        }
        if (name) {
            return container.getNamed(identifier, name);
        }
        else {
            return container.get(identifier);
        }
    }
}

if ("undefined" === typeof global["checkConstant"]) {
    global["checkConstant"] = function checkConstant(identifier: symbol | string, name?: string): boolean {
        let container: Container = getMetadata("DI", global);
        if (container) {
            try {
                let fakeConstant = null;
                if (name) {
                    fakeConstant = container.getNamed(identifier, name);
                }
                else {
                    fakeConstant = container.get(identifier);
                }
                return !!fakeConstant;
            }
            catch (e) {
                return false;
            }
        }
        return false;
    }
}

if ("undefined" === typeof global["checkDependency"]) {
    global["checkDependency"] = function checkDependency(identifier: symbol | string, newable: boolean = false, name?: string) {
        let container: Container = getMetadata("DI", global);
        if (container) {
            try {
                let fakeDependency = null;
                if (name) {
                    if (newable) {
                        fakeDependency = container.getNamed(generateNewableIdentifier(identifier), name);
                    }
                    else {
                        fakeDependency = container.getNamed(identifier, name);
                    }
                }
                else {
                    if (newable) {
                        fakeDependency = container.get(generateNewableIdentifier(identifier));
                    }
                    else {
                        fakeDependency = container.get(identifier);
                    }
                }
                return !!fakeDependency;
            }
            catch (e) {
                return false;
            }
        }
        return false;
    }
}

if ("undefined" === typeof global["extendClass"]) {
    global["extendClass"] = function extendClass(derivedCtor: { new(...args): any }, baseCtors: { new(...args): any }, ...moreBaseCtors: { new(...args): any }[]) {
        moreBaseCtors.unshift(baseCtors);
        moreBaseCtors.forEach(baseCtor => {
            let baseCtorProperties = getProperties(baseCtor);
            baseCtorProperties.map(property => {
                Property(property.type as PropertyType, { required: property.required })(derivedCtor, property.name);
            })
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
                if (name !== 'constructor') {
                    derivedCtor.prototype[name] = baseCtor.prototype[name];
                }
            });
        });
    }
}

if ("undefined" === typeof global["Injectable"]) {
    global["Injectable"] = function Injectable<T>(serviceName: string, newable?: boolean, isDefault?: boolean) {
        return (target: any) => {
            injectable()(target);
            let targetClass = getClass(target);
            let isExists = checkDependency(serviceName, newable, targetClass.name);
            if (!isExists) {
                registerDependency<T>(serviceName, targetClass, newable, isDefault);
            }
            else {
                registerDependencyAgain<T>(serviceName, targetClass, newable, isDefault);
            }
        }
    }
}
const LOGGER_SERVICE = "ILogger";
if("undefined" === typeof global["LOGGER_SERVICE"]){
    global["LOGGER_SERVICE"] = LOGGER_SERVICE;
}
const LOGGER_UTILS = {
    reset: "\\x1b[0m",
    bright: "\x1b[1m",
    dim: "\\x1b[2m",
    bold: "\\u001b[1m",
    underline: "\\x1b[4m",
    blink: "\\x1b[5m",
    reverse: "\\x1b[7m",
    hidden: "\\x1b[8m",
    fgblack: "\\x1b[30m",
    fgred: "\\x1b[31m",
    fggreen: "\\x1b[32m",
    fgyellow: "\\x1b[33m",
    fgblue: "\\x1b[34m",
    fgmagenta: "\\x1b[35m",
    fgcyan: "\\x1b[36m",
    fgwhite: "\\x1b[37m",
    bgblack: "\\x1b[40m",
    bgred: "\\x1b[41m",
    bggreen: "\\x1b[42m",
    bgyellow: "\\x1b[43m",
    bgblue: "\\x1b[44m",
    bgmagenta: "\\x1b[45m",
    bgcyan: "\\x1b[46m",
    bgwhite: "\\x1b[47m"
}
if("undefined" === typeof global["LOGGER_UTILS"]){
    global["LOGGER_UTILS"] = LOGGER_UTILS;
}
const FONT_COLOR_DEFAULT = ["red", "green", "yellow", "blue", "magenta", "cyan", "white"];
if("undefined" === typeof global["FONT_COLOR_DEFAULT"]){
    global["FONT_COLOR_DEFAULT"] = FONT_COLOR_DEFAULT;
}
const FONT_COLOR_DEFAULT_LENGTH = FONT_COLOR_DEFAULT.length;
if("undefined" === typeof global["FONT_COLOR_DEFAULT_LENGTH"]){
    global["FONT_COLOR_DEFAULT_LENGTH"] = FONT_COLOR_DEFAULT.length; 
}

function generateLog(): string{
    let length = arguments.length;
    let outputMessage = [];
    for(let i = 0; i < length; i++){
        let key = i.toString();
        if("undefined" === typeof arguments[key]){
            outputMessage.push("undefined");
        }
        else if (arguments[key] === null){
            outputMessage.push("null");
        }
        else if(typeof arguments[key] === "number" || typeof arguments[key] === "boolean"){
            outputMessage.push(arguments[key].toString());
        }
        else if(typeof arguments[key] === "object"){
            outputMessage.push(JSON.circularStringify(arguments[key]));
        }
        else {
            outputMessage.push(arguments[key]);
        }
    }
    let outputString = outputMessage.join(" ").trim();
    return outputString;
}

if("undefined" === typeof global["logger"]){
    class Logger implements ILogger {
        getType(): IClassType {
            throw new Error("Method not implemented.");
        }
        static maxLength: number = 0;
        private tracing: boolean;
        private eventInstance: EventEmitter;
        private appName: string;
        private displayAppName: string;
        private on(event: "data", listener: (data: string) => void): ILogger {
            this.eventInstance.on(event, listener);
            return this;
        }
        expand(): ILogger {
            return getDependency<ILogger>(LOGGER_SERVICE, true);
        }
        pushLog(log: ILog);
        pushLog(message: string, level: "silly" | "debug" | "error" | "info" | "warn", tag: string, style?: IMessageStyle);
        pushLog(arg0: (string | ILog), arg1?: "silly" | "debug" | "error" | "info" | "warn", arg2?: string, arg3?: IMessageStyle) {
            if(this.tracing){
                if (typeof arg0 === "string") {
                    let outputString = "";
                    let message = arg0 as string;
                    let level = arg1 as "silly" | "debug" | "error" | "info" | "warn";
                    let tag = arg2 as string;
                    let style = arg3 as IMessageStyle;
                    if (style) {
                        if (style.bold) {
                            outputString += \`\${LOGGER_UTILS.bold}\`;
                        }
                        if (style.underline) {
                            outputString += \`\${LOGGER_UTILS.underline}\`;
                        }
                        if (style.fontColor) {
                            outputString += \`\${LOGGER_UTILS["fg" + style.fontColor]}\`;
                        }
                        if (style.backgroundColor) {
                            outputString += \`\${LOGGER_UTILS["bg" + style.backgroundColor]}\`;
                        }
                    }
                    let date = new Date();
                    let dateString = \`\${LOGGER_UTILS.fgcyan}\${date.toISOString()}(\${date.toLocaleString()})\${LOGGER_UTILS.reset}\`;
                    let prefix = \`\${LOGGER_UTILS.fgwhite}SILLY\`;
                    if (level === "debug") {
                        prefix = \`\${LOGGER_UTILS.fgblue}DEBUG\`;
                    }
                    else if (level === "info") {
                        prefix = \`\${LOGGER_UTILS.fggreen} INFO\`;
                    }
                    else if (level === "error") {
                        prefix = \`\${LOGGER_UTILS.fgred}ERROR\`;
                    }
                    else if (level === "warn"){
                        prefix = \`\${LOGGER_UTILS.fgyellow} WARN\`;
                    }
                    prefix += \`\${LOGGER_UTILS.reset}\`;
                    message = \`\${outputString}\${message}\${LOGGER_UTILS.reset}\`;
                    let resultString = \`\${this.displayAppName} - \${dateString} - \${prefix}\${tag ? " - [" + tag + "]" : ""} - \${message}\`;
                    this.eventInstance.emit("data", resultString);
                }
                else {
                    let log = arg0 as ILog;
                    let messageText = [];
                    let tag = log.message.tag;
                    log.message.messages.map(message => {
                        let outputString = "";
                        if (message.style) {
                            if (message.style.fontColor) {
                                outputString += \`\${LOGGER_UTILS["fg" + message.style.fontColor]}\`;
                            }
                            if (message.style.backgroundColor) {
                                outputString += \`\${LOGGER_UTILS["bg" + message.style.backgroundColor]}\`;
                            }
                            if (message.style.bold) {
                                outputString += \`\${LOGGER_UTILS.bold}\`;
                            }
                            if (message.style.underline) {
                                outputString += \`\${LOGGER_UTILS.underline}\`;
                            }
                        }
                        outputString += message.text + \`\${LOGGER_UTILS.reset}\`;
                        messageText.push(outputString);
                    });
                    let date = new Date();
                    let dateString = \`\${LOGGER_UTILS.fgcyan}\${date.toISOString()}(\${date.toLocaleString()})\${LOGGER_UTILS.reset}\`;
                    let prefix = \`\${LOGGER_UTILS.fgwhite}SILLY\`;
                    if (log.level === "debug") {
                        prefix = \`\${LOGGER_UTILS.fgblue}DEBUG\`;
                    }
                    else if (log.level === "info") {
                        prefix = \`\${LOGGER_UTILS.fggreen} INFO\`;
                    }
                    else if (log.level === "error") {
                        prefix = \`\${LOGGER_UTILS.fgred}ERROR\`;
                    }
                    else if (log.level === "warn"){
                        prefix = \`\${LOGGER_UTILS.fgyellow} WARN\`;
                    }
                    prefix += \`\${LOGGER_UTILS.reset}\`;
                    let resultString = \`\${this.displayAppName} - \${dateString} - \${prefix}\${tag ? " - [" + tag +"]" : ""} - \${messageText.join(log.message.delimiter)}\`;
                    this.eventInstance.emit("data", resultString);
                }
            }
        }
        pushWarn(message: string, tag: string) {
            if(this.tracing) this.pushLog(message, "warn", tag, { fontColor: "yellow" });
        }
        pushError(message: Error, tag: string);
        pushError(message: string, tag: string);
        pushError(message: Error | string, tag: string){
            if(this.tracing){
                if(typeof message === "string"){
                    this.pushLog(message, "error", tag, { fontColor: "red" });
                }
                else if(message instanceof Error){
                    let errorMessage = \`\${message.message}\`;
                    this.pushLog(errorMessage.trim(), "error", tag, { fontColor: "red" });
                    let stacks = message.stack.split("\\n");
                    stacks.map(stack => {
                        this.pushLog(stack.trim(), "error", tag, { fontColor: "red" });
                    });
                }
            }
        }
        pushSilly(message: string, tag: string) {
            if(this.tracing) this.pushLog(message, "silly", tag, { fontColor: "white" });
        }
        pushDebug(message: string, tag: string) {
            if(this.tracing) this.pushLog(message, "debug", tag, { fontColor: "blue" });
        }
        pushInfo(message: string, tag: string){
            if(this.tracing) this.pushLog(message, "info", tag, { fontColor: "green" });
        }
        trace(isTrace: boolean) {
            this.tracing = isTrace;
        }
        constructor() {
            this.eventInstance = new EventEmitter();
            this.on("data", (data) => {
                let message: string = "";
                if(typeof data !== "string"){
                    message = JSON.stringify(data);
                }
                else{
                    message = data;
                }
                if(message !== "\\n"){
                    message = message.replace(/[\\n\\n]/g, "\\n");
                    if(message.lastIndexOf("\\n") !== message.length - 1){
                        message += "\\n";
                    }
                }
                process.stdout.write(message);
            });
        }
        initValue(input: Partial<ILoggerProperty>){
            this.appName = input.appName;
            let fontColorIndex = Math.floor(Math.random() * FONT_COLOR_DEFAULT_LENGTH);
            let fontColor = FONT_COLOR_DEFAULT[fontColorIndex];
            if(input.appName){
                if(Logger.maxLength <= input.appName.length){
                    Logger.maxLength = input.appName.length;
                }
                else{
                    let missingLength = Logger.maxLength - input.appName.length;
                    for(let i = 0; i < missingLength; i++){
                        input.appName = " " + input.appName;
                    }
                }
                this.appName = input.appName;
                this.displayAppName = \`\${LOGGER_UTILS["fg" + fontColor]}\${input.appName}\${LOGGER_UTILS.reset}\`;
            }
        }
        
    }
    Injectable(LOGGER_SERVICE, true, true)(Logger);
    global["logger"] = getDependency<ILogger>(LOGGER_SERVICE);
    logger.trace(true);
    
    const logFunc = console.log;
    const warnFunc = console.warn;
    const errorFunc = console.error;
    const debugFunc = console.debug;
    const infoFunc = console.info;
    console.log = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushSilly(outputString, "system");
        }
        catch(e){
            logFunc.apply(console, arguments);
        }
    }
    console.warn = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushWarn(outputString, "system");
        }
        catch(e){
            warnFunc.apply(console, arguments);
        }
    }
    console.error = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushError(outputString, "system");
        }
        catch(e){
            errorFunc.apply(console, arguments);
        }
    }
    console.debug = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushDebug(outputString, "system");
        }
        catch(e){
            debugFunc.apply(console, arguments);
        }
    }
    console.info = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushInfo(outputString, "system");
        }
        catch(e){
            infoFunc.apply(console, arguments);
        }
    }
}

if (!process.watcher) {
    process.watcher = {
        emit: function (events: "STOP", id: string) {
            (this.event as EventEmitter).emit("STOP", id);
        },
        init() {
            if (!this.isInit) {
                this.isInit = true;
                (this.event as EventEmitter).on("STOP", (id: string) => {
                    this.memberIds[id] = "stopped";
                    let stopped = true;
                    Object.values(this.memberIds).map(status => {
                        if (status === "active") {
                            stopped = false;
                        }
                    });
                    if (stopped) {
                        console.log("Kill this process.........");
                        process.exit(0);
                    }
                });
            }
        },
        joinFrom(id: string) {
            let keys = Object.keys(this.memberIds);
            if (!keys.includes(id)) {
                this.memberIds[id] = "active";
            }
        }
    }
    Object.defineProperty(process.watcher, "memberIds", {
        configurable: false,
        writable: true,
        value: {}
    });
    Object.defineProperty(process.watcher, "isInit", {
        configurable: false,
        writable: true,
        value: false
    })
    Object.defineProperty(process.watcher, "event", {
        configurable: false,
        writable: false,
        value: new EventEmitter()
    });
    process.watcher.init();
}

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
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

if ("undefined" === typeof global["Context"]){
    class Context implements IContext{
        getType(): IClassType {
            throw new Error("Method not implemented.");
        }
        initValue(input: Partial<IContextProperty>): void {
            throw new Error("Method not implemented.");
        }
        held?: boolean;
        flushed?: boolean;
        private _type?: any;
        private _resource?: any;
        value?: any;
        children?: Array<number>;
        manual?: boolean;
        prev?: number;
        set type(value: any){
            this._type = value;
        }
        set resource(value: any){
            this._resource = value;
        }
        
        originValue(){
            return {
                value: this.value,
                prev: this.prev,
                manual: this.manual,
                children: this.children
            }
        }
    
        rawValue(){
            return{
                resource: this._resource,
                type: this._type,
                value: this.value,
                prev: this.prev,
                manual: this.manual,
                children: this.children
            }
        }
    
        constructor();
        constructor(input: IContextValue);
        constructor(input?: IContextValue){
            if(input){
                this._type = input.type;
                this._resource = input.resource;
                this.value = input.value;
                this.children = input.children;
                this.manual = input.manual;
                this.prev = input.prev;
            }
        }
    }
    global["Context"] = Context;
}

if ("undefined" === typeof global["createHooks"]){
    global["createHooks"] = function createHooks(namespace: INamespace) {
        function init(asyncId, type, triggerId, resource) {
            let parent = namespace.getById(triggerId);
            if (parent) {
                let current = namespace.getById(asyncId);
                if(!current){
                    current = new Context({
                        value   : {},
                        type    : type,
                        resource: resource,
                        manual  : false,
                        prev    : null
                    });
                }
                current.value = parent ? parent.value : {};
                current.manual = false;
                current.prev = triggerId;
                current.held = parent ? parent.held : false;
                namespace.setById(asyncId, current);
                if(!parent.children){
                    parent.children = [];
                }
                parent.children.push(asyncId);
                namespace.setById(triggerId, parent);
            }
        }
    
        function destroy(asyncId) {
            namespace.flush(asyncId);
        }
    
        const asyncHook = asyncHooks.createHook({ init, destroy });
    
        asyncHook.enable();
    }
}

if("undefined" === typeof global["Namespace"]){
    class Namespace implements INamespace{
        getType(): IClassType {
            throw new Error("Method not implemented.");
        }
        initValue(input: Partial<any>): void {
            throw new Error("Method not implemented.");
        }
        private static namespaces: {} = {};
        static create(name: string): INamespace {
            if (Namespace.namespaces[name]) {
                throw new Error(\`A namespace for \${name} is already exists\`);
            }
            let namespace = new Namespace();
            Namespace.namespaces[name] = namespace;
            createHooks(namespace);
            return namespace;
        }
        
        static get(name: string): INamespace {
            return Namespace.namespaces[name];
        }
    
        static destroy(name: string){
            delete Namespace.namespaces[name];
        }
    
        private context: {
            [key in string]: IContext
        };
    
        constructor() {
            this.context = {};
        }
    
        cloneById(sourceId: number){
            let source = this.getById(sourceId);
            let destValue = assignData(source.value);
            let dest = new Context({
                children: [],
                flushed: false,
                held: false,
                manual: true,
                prev: null,
                value: destValue,
                type: source.type,
                resource: source.resource ? assignData(source.resource) : undefined
            });
            this.setById(asyncHooks.triggerAsyncId(), dest);
        }
    
        holdById(id: number){
            let current = this.getById(id);
            if(current){
                current.held = true;
                this.setById(id, current);
            }
        }
    
        getCurrentId(){
            return asyncHooks.executionAsyncId();
        }
    
        getParentId(){
            return asyncHooks.triggerAsyncId();
        }
    
        originValue(){
            let origins: {
                [key in string]: IContextOriginValue
            } = {};
            let valueKeys = Object.keys(this.context);
            Object.values(this.context).map((value, index) => {
                if(typeof value.originValue === "function"){
                    origins[valueKeys[index]] = value.originValue();
                }
                else{
                    origins[valueKeys[index]] = value;
                }
            })
            return origins;
        }
    
        rawValue(){
            let raws: {
                [key in string]: IContextValue
            } = {};
            let valueKeys = Object.keys(this.context);
            Object.values(this.context).map((value, index) => {
                if(typeof value.rawValue === "function"){
                    raws[valueKeys[index]] = value.rawValue();
                }
                else{
                    raws[valueKeys[index]] = value;
                }
            })
            return raws;
        }
    
        run(func: Function) : Promise<void>{
            let asyncId = asyncHooks.executionAsyncId();
            let triggerId = asyncHooks.triggerAsyncId();
            let parent = this.getById(triggerId);
            if (parent) {
                // Here we keep passing the context from 
                // the triggerId to the new asyncId
                let current = this.getById(asyncId);
                if(!current){
                    current = new Context({
                        value   : {},
                        manual  : false,
                        prev    : null
                    });
                }
                current.value = parent ? parent.value : {};
                current.manual = true;
                current.prev = triggerId;
                current.held = parent ? parent.held : false;
                this.setById(asyncId, current);
                if(!parent.children){
                    parent.children = [];
                }
                parent.children.push(asyncId);
                this.setById(triggerId, parent);
            }
            else{
                let current = this.getById(asyncId);
                if(!current){
                    current = new Context({
                        value   : {},
                        manual  : false,
                        prev    : null
                    });
                }
                current.value = {};
                current.manual = true;
                this.setById(asyncId, current);
            }
            if(func instanceof AsyncFunction){
                return func();
            }
            else{
                return new Promise((resolve, reject) => {
                    try{
                        func();
                        resolve();
                    }
                    catch(e){
                        reject(e);
                    }
                });
            }
        }
    
        getById(id: number): IContext {
            return this.context[id];
        }
        setById(id: number, value: IContext): void {
            this.context[id] = value;
        }
        removeById(id: number, key){
            if(this.context[id] && this.context[id]["value"]) {
                delete this.context[id]["value"][key];
            }
        }
    
        set(key, value) {
            const eid = asyncHooks.executionAsyncId();
            if(!this.context[eid]){
                this.context[eid] = new Context({
                    value   : {},
                    manual  : true,
                    prev    : asyncHooks.triggerAsyncId()
                });
            }
            this.context[eid].manual = true;
            this.context[eid]["value"][key] = value;
        }
    
        get<T>(key): T {
            const eid = asyncHooks.executionAsyncId();
            if(this.context[eid] && this.context[eid]["value"]){
                return this.context[eid]["value"][key] as T;
            }
            else{
                return null;
            }
        }
    
        remove(key){
            const eid = asyncHooks.executionAsyncId();
            if(this.context[eid] && this.context[eid]["value"]) {
                delete this.context[eid]["value"][key];
            }
        }
    
        flush(id, force = false){
            let current = this.context[id];
            if(current){
                if(!current.held || (current.held && current.flushed && force) || force){
                    let parent = current.prev !== null ? this.context[current.prev] : null;
                    let currentIsFlushed = false;
                    if(current.children){
                        let children = current.children;
                        let childrenLength = children.length;
                        for(let i = 0; i < childrenLength; i++){
                            let currentChild = this.context[children[i]];
                            if(!currentChild){
                                children.splice(i, 1);
                                i--;
                                childrenLength--;
                            }
                            else if(!currentChild.held || (currentChild.held && force)){
                                delete this.context[children[i]];
                                children.splice(i, 1);
                                i--;
                                childrenLength--;
                            }
                        }
                        if(children.length === 0){
                            delete this.context[id];
                            currentIsFlushed = true;
                        }
                        else{
                            current.children = children;
                            current.flushed = true;
                            this.context[id] = current;
                        }
                    }
                    if(currentIsFlushed){
                        if(parent && parent.children){
                            let children = parent.children;
                            let childrenLength = children.length;
                            for(let i = 0; i < childrenLength; i++){
                                let child = this.context[children[i]];
                                if(child && !child.manual){
                                    delete this.context[children[i]];
                                    children.splice(i, 1);
                                    i--;
                                }
                            }
                            parent.children = children;
                            if(parent.children.length === 0){
                                delete this.context[current.prev];
                            }
                            else{
                                this.context[current.prev] = parent;
                            }
                        }
                    }
                }
                else{
                    current.flushed = true;
                    this.context[id] = current;
                }
            }
        }
    
        dispose(){
            this.context = {};
        }
    }
    global["Namespace"] = Namespace;
}

if ("undefined" === typeof global["Type"]) {
    type TType = {
        class: {
            [key: string]: IClassType
        },
        interface: {
            [key: string]: IInterfaceType
        },
        construct: {
            [key: string]: IConstructorType
        },
        intrinsic: {
            [key: string]: IIntrinsicType
        },
        method: {
            [key: string]: IMethodType
        },
        property: {
            [key: string]: IPropertyType
        }
    };
    global["Type"] = {
        compare(input: any, name: string, kind?: "class" | "construct" | "method" | "interface" | "property"): boolean {
            if (kind) {
                let type = types[kind][name];
                let checked = false;
                switch (kind) {
                    case "class":
                        break;
                    case "construct":
                        break;
                    case "interface":
                        break;
                    case "property":
                        break;
                    case "method":
                        break;
                    default:
                        break;
                }
                return checked;
            }
            else {
                if (name === "array") {
                    return Array.isArray(input);
                }
                return typeof input === name;
            }
        },
        has(name: string, kind: string): boolean {
            if (types[kind][name]) {
                return true;
            }
            return false;
        },
        declare(type: IClassType | IInterfaceType | IConstructorType | IMethodType | IPropertyType) {
            let checked = Type.has(type.name, type.kind);
            if (!checked) {
                types[type.kind][type.name] = type;
                defineMetadata(typeKey, types, Type);
            }
        },
        get(name: string, kind?: "class" | "construct" | "method" | "interface" | "property"): IClassType | IInterfaceType | IConstructorType | IIntrinsicType | IMethodType | IPropertyType {
            if (kind) {
                return types[kind][name];
            }
            else {
                return types.intrinsic[name];
            }
        }
    }
    let types: TType = getMetadata<TType>("Type", Type);
    if (!types) {
        types = {
            class: {},
            interface: {},
            construct: {},
            method: {},
            property: {},
            intrinsic: {
                Any: { kind: "intrinsic", name: "any" },
                Void: { kind: "intrinsic", name: "void" },
                Number: { kind: "intrinsic", name: "number" },
                String: { kind: "intrinsic", name: "string" },
                Object: { kind: "intrinsic", name: "object" },
                Boolean: { kind: "intrinsic", name: "boolean" },
                Array: { kind: "intrinsic", name: "array" }
            }
        };
        defineMetadata(typeKey, types, Type);
    }
}`;