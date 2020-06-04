import "reflect-metadata";
import { join } from "path";
import BuiltInModule from "module";
import { injectable, Container } from "inversify";
import * as asyncHooks from "async_hooks";
import { EventEmitter } from "events";
if("undefined" === typeof global["system"]){
    const system: ISystem = {
        log: console.log,
        warn: console.warn,
        debug: console.debug,
        error: console.error,
        info: console.info
    }
    global["system"] = system;
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

if ("undefined" === typeof global["generateNewableIdentifier"]) {
    global["generateNewableIdentifier"] = function generateNewableIdentifier(identifier: symbol | string) {
        let newableIdentifier: symbol | string = null;
        if (typeof identifier === "string") {
            newableIdentifier = `Newable<${identifier}>`;
        }
        else {
            let symbolString = identifier.toString().replace("Symbol(", "").replace(")", "");
            newableIdentifier = Symbol.for(`Newable<${symbolString}>`);
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
            container = new Container({skipBaseClassChecks: true});
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
            container = new Container({skipBaseClassChecks: true});
        }
        rebindToContainer<T>(container, identifier, service, newable, isDefault);
        defineMetadata("DI", container, global);
    }
}

if ("undefined" === typeof global["registerConstant"]) {
    global["registerConstant"] = function registerConstant<T>(identifier: symbol | string, constantValue: T, name?: string) {
        let container: Container = getMetadata("DI", global);
        if (!container) {
            container = new Container({skipBaseClassChecks: true});
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
};
if ("undefined" === typeof global["typeKey"]) {
    global["typeKey"] = "Type";
}

if ("undefined" === typeof global["PropertyTypes"]) {
    enum PropertyTypes {
        Any = "$_any"
    }
    global["PropertyTypes"] = PropertyTypes;
}

if ("undefined" === typeof global["PROPERTIES_KEY"]) {
    global["PROPERTIES_KEY"] = Symbol.for("property");
}

if ("undefined" === typeof global["CLASS_KEY"]) {
    global["CLASS_KEY"] = Symbol.for("class");
}

if ("undefined" === typeof global["REAL_DATA_TYPE_KEY"]) {
    global["REAL_DATA_TYPE_KEY"] = Symbol.for("real-data-type");
}

if ("undefined" === typeof global["DynamicProperty"]) {
    global["DynamicProperty"] = function DynamicProperty(type: { new(...args: any[]): any } | PropertyType, options?: {
        required?: boolean
    }) {
        return (target: any) => {
            let columns: IProperty[] = getMetadata(PROPERTIES_KEY, target) || [];
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
            defineMetadata(PROPERTIES_KEY, columns, target);
        }
    }
}

if ("undefined" === typeof global["PropertyArray"]) {
    global["PropertyArray"] = function PropertyArray(type: { new(...args: any[]): any } | PropertyTypeLiteral | PropertyTypeList): PropertyTypeList {
        return {
            type: "list",
            value: type
        } as PropertyTypeList
    }
}

if ("undefined" === typeof global["PropertyMap"]) {
    global["PropertyMap"] = function PropertyMap(type: { new(...args: any[]): any }): PropertyTypeMap {
        return {
            type: "map",
            value: type
        } as PropertyTypeMap;
    }
}

if ("undefined" === typeof global["PropertyLiteral"]) {
    global["PropertyLiteral"] = function PropertyLiteral(type: PropertyTypeValue, ...moreType: PropertyTypeValue[]): PropertyTypeLiteral {
        moreType.unshift(type);
        let literalProperty: PropertyTypeLiteral = {
            type: "literal",
            value: [] as PropertyTypeValue[]
        }
        moreType.map(type => {
            literalProperty.value.push(type);
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
            defineMetadata(PROPERTIES_KEY, columns, target);
        }
    }
}

if ("undefined" === typeof global["getProperties"]) {
    global["getProperties"] = function getProperties(target: any): IProperty[] {
        let properties = getMetadata<IProperty[]>(PROPERTIES_KEY, target);
        return properties || [];
    }
}

if ("undefined" === typeof global["defaultValue"]) {
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
            if (type === "array" && Array.isArray(input)) {
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

if ("undefined" === typeof global["IsPropertyType"]) {
    global["IsPropertyType"] = function IsPropertyType(propertyType: any): boolean {
        if (propertyType.type && propertyType.value) return true;
        else return false;
    }
}

if ("undefined" === typeof global["mapData"]) {
    type TValid = 1 | 0;
    interface IMapDataResult {
        isValid: TValid;
        result: any;
    }
    class MapDataResult implements IMapDataResult {
        isValid: 0 | 1;
        result: any;
        static toResult(result, isValid: TValid = 1): IMapDataResult {
            let data = new MapDataResult();
            data.isValid = isValid;
            data.result = result;
            return data;
        }
    }
    function NullOrUndefined(value) {
        return typeof value === "undefined" || value === null;
    }
    function mapToNumber(input): boolean{
        try {
            let result = Number(input);
            return !isNaN(result);
        }
        catch(e){
            return false;
        }
    }
    function mapToString(input): boolean {
        try {
            if(input && typeof input !== "object"){
                String(input);
                return true;
            }
            else {
                return false;
            }
        }
        catch(e){
            return false;
        }
    }
    function mapToBoolean(input): boolean {
        if(input === "true" || input === "false" || input === true || input === false) return true;
        return false;
    }
    function mapToObject(input: string): boolean {
        if(typeof input !== "string" && typeof input === "object") return true;
        else {
            try {
                let result = JSON.__base__circularParse(input);
                return true;
            }
            catch(e){
                return false;
            }
        }
    }
    function checkSourceValue(source, expectType: "string" | "boolean" | "number" | "function"): boolean {
        if (typeof source === expectType) return true;
        else {
            if(expectType !== "function"){
                switch(expectType){
                    case "number": return mapToNumber(source);
                    case "string": return mapToString(source);
                    case "boolean": return mapToBoolean(source);
                }
            }
            return false
        }
    }
    function mapDataFromPropertyValueObject(dest, propertyTypeValue: PropertyTypeValueObject, name: string | number, value: any, required: boolean = false): IMapDataResult {
        let isValid = 1;
        let delimiter = typeof name === "string" ? Object.__base__getDelimiter(name) : ".";
        switch (propertyTypeValue.name) {
            case "String":
                if (checkSourceValue(value, "string")) Object.__base__setAt(dest, name, String(value), delimiter);
                else if (required || !NullOrUndefined(value)) isValid *= 0;
                break;
            case "Number":
                if (checkSourceValue(value, "number")) Object.__base__setAt(dest, name, Number(value), delimiter);
                else if (required || !NullOrUndefined(value)) isValid *= 0;
                break;
            case "Boolean":
                if (checkSourceValue(value, "boolean")) Object.__base__setAt(dest, name, Boolean(value), delimiter);
                else if (required || !NullOrUndefined(value)) isValid *= 0;
                break;
            case "Function":
                if (checkSourceValue(value, "function")) Object.__base__setAt(dest, name, value, delimiter);
                else if (required || !NullOrUndefined(value)) isValid *= 0;
                break;
            case "Date":
                if (checkSourceValue(value, "string") || checkSourceValue(value, "number") || value instanceof Date) {
                    try {
                        let dataValue = new Date(value as (string | number | Date));
                        if (dataValue.toString() === "Invalid Date") throw new Error("Invalid Date");
                        else Object.__base__setAt(dest, name, dataValue, delimiter);
                    }
                    catch (e) {
                        if (required || !NullOrUndefined(value)) isValid *= 0;
                    }
                }
                else if (required) isValid *= 0;
                break;
            default:
                if(typeof value === "string") {
                    if(mapToObject(value)) value = JSON.__base__circularParse(value);
                    else {
                        let fakeType: any = propertyTypeValue as any;
                        if(typeof fakeType.__base__fromString === "function") value = fakeType.__base__fromString(value); 
                    }
                    let dataResult = mapData(propertyTypeValue, value, name.toString());
                    if (dataResult.error) isValid *= 0;
                    else Object.__base__setAt(dest, name, dataResult.value, delimiter);
                }
                else if (typeof value !== "object") {
                    if (required || !NullOrUndefined(value)) isValid *= 0;
                }
                else {
                    let dataResult = mapData(propertyTypeValue, value, name.toString());
                    if (dataResult.error) isValid *= 0;
                    else Object.__base__setAt(dest, name, dataResult.value, delimiter);
                }
        }
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function mapDataFromPropertyValueMap(dest, propertyTypeValue: (PropertyTypeValueObject | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList), name: string | number, value: any, required: boolean = false): IMapDataResult {
        let isValid: TValid = 1;
        if(value instanceof Map){
            let mapDest = new Map();
            value.forEach((v, k) => {
                let innerDest = {};
                if(IsPropertyType(propertyTypeValue)){
                    if((<PropertyType>propertyTypeValue).value === PropertyTypes.Any){
                        isValid = 1;
                        mapDest.set(k, v);
                    }
                    if((<PropertyType>propertyTypeValue).type === "list"){
                        let mapDataResult = mapDataFromPropertyValueList(innerDest, (<PropertyType>propertyTypeValue).value as (PropertyTypeValueObject | PropertyTypeList | PropertyTypeLiteral | PropertyTypeMap), k, v, required);
                        isValid *= mapDataResult.isValid;
                        if(isValid && innerDest){
                            mapDest.set(k, innerDest[k]);
                        }
                    }
                    else if((<PropertyType>propertyTypeValue).type === "literal"){
                        let mapDataResult = prepareMapDataForLiteral(innerDest, (<PropertyType>propertyTypeValue).value as PropertyTypeValue[], k, v, required);
                        isValid *= mapDataResult.isValid;
                        if(isValid && innerDest){
                            mapDest.set(k, innerDest[k]);
                        }
                    }
                    else {
                        let mapDataResult = mapDataFromPropertyValueMap(innerDest, (<PropertyType>propertyTypeValue).value  as (PropertyTypeValueObject | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList), k, v, required);
                        isValid *= mapDataResult.isValid;
                        if(isValid && innerDest) mapDest.set(k, innerDest[k]);
                    }
                }
                else {
                    let mapDataResult = mapDataFromPropertyValueObject(innerDest, propertyTypeValue as PropertyTypeValueObject, k, v, required);
                    isValid *= mapDataResult.isValid;
                    if(isValid && innerDest) mapDest.set(k, innerDest[k]);
                }
            });
            if(isValid){
                dest[name] = mapDest;
            }
        }
        else if(!(NullOrUndefined(value)) || (NullOrUndefined(value) && required)) isValid *= 0;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function mapDataFromPropertyValueList(dest, propertyTypeValue: (PropertyTypeValueObject | PropertyTypeLiteral | PropertyTypeList | PropertyTypeMap), name: string | number, value: any, required: boolean = false): IMapDataResult {
        let isValid: TValid = 1;
        if (Array.isArray(value)) {
            let innerDest = [];
            value.map((v, i) => {
                if (IsPropertyType(propertyTypeValue)) {
                    if((<PropertyType>propertyTypeValue).value === PropertyTypes.Any){
                        innerDest.push(v);
                        isValid *= 1;
                    }
                    else if ((<PropertyTypeList>propertyTypeValue).type === "list") {
                        let mapDataResult = mapDataFromPropertyValueList(innerDest, (<PropertyTypeList>propertyTypeValue).value as (PropertyTypeValueObject | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList), i, v, required);
                        isValid *= mapDataResult.isValid;
                    }
                    else if((<PropertyTypeLiteral>propertyTypeValue).type === "literal"){
                        let mapDataResult = prepareMapDataForLiteral(innerDest, (<PropertyTypeLiteral>propertyTypeValue).value as PropertyTypeValue[], i, v, required);
                        isValid *= mapDataResult.isValid;
                    }
                    else {
                        let mapDataResult = mapDataFromPropertyValueMap(innerDest, (<PropertyTypeMap>propertyTypeValue).value as (PropertyTypeValueObject | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList), i, v, required);
                        isValid *= mapDataResult.isValid;
                    }
                }
                else {
                    let mapDataResult = mapDataFromPropertyValueObject(innerDest, propertyTypeValue as PropertyTypeValueObject, i, v, required);
                    isValid *= mapDataResult.isValid;
                }
            });
            if (isValid && innerDest) {
                dest[name] = innerDest;
            }
        }
        else if (!(NullOrUndefined(value)) || (NullOrUndefined(value) && required)) isValid *= 0;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function mapDataFromPropertyValueLiteral(dest, propertyTypeValues: (PropertyTypeSpecificValue | PropertyTypeValueObject | PropertyType)[], name: string | number, value: any, required: boolean = false): IMapDataResult {
        let isValid: TValid = 1,
            check = { isSpecific: false, isObject: false, isPropertyType: false };
        if (propertyTypeValues && propertyTypeValues.length > 0) {
            if (typeof propertyTypeValues[0] === "string" || typeof propertyTypeValues[0] === "number" || typeof propertyTypeValues[0] === "boolean") check.isSpecific = true;
            else if (typeof propertyTypeValues[0] === "function") check.isObject = true;
            else check.isPropertyType = true;
        }
        if (check.isSpecific) {
            if (!propertyTypeValues.includes(value)) isValid *= 0;
            else dest[name] = value;
        }
        else if (check.isObject) {
            let length = propertyTypeValues.length,
                mapDataResult: IMapDataResult;
            for (let i = 0; i < length; i++) {
                mapDataResult = mapDataFromPropertyValueObject(dest, propertyTypeValues[i] as PropertyTypeValueObject, name, value, required);
                if (mapDataResult.isValid) break;
            }
            isValid *= mapDataResult.isValid;
        }
        else if (check.isPropertyType) {
            let length = propertyTypeValues.length,
                mapDataResult: IMapDataResult = MapDataResult.toResult(null, 1);
            for (let i = 0; i < length; i++) {
                let propertyType: PropertyType = propertyTypeValues[i] as PropertyType;
                if(propertyType.value === PropertyTypes.Any){
                    dest[name] = value;
                    mapDataResult.isValid = 1;
                    break;
                }
                else if (propertyType.type === "list") {
                    mapDataResult = mapDataFromPropertyValueList(dest, propertyType.value as any, name, value, required);
                    if (mapDataResult.isValid) break;
                }
                else if (propertyType.type === "literal") {
                    mapDataResult = mapDataFromPropertyValueLiteral(dest, propertyType.value, name, value, required);
                    if (mapDataResult.isValid) break;
                }
                else {
                    mapDataResult = mapDataFromPropertyValueMap(dest, propertyType.value as PropertyTypeMap, name, value, required);
                    if (mapDataResult.isValid) break;
                }
            }
            isValid *= mapDataResult.isValid;
        }
        else if(!(NullOrUndefined(value)) || (NullOrUndefined(value) && required)) isValid *= 0;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function prepareMapDataForLiteral(dest, propertyTypeValues: PropertyTypeValue[], name: string | number, value: any, required: boolean = false): IMapDataResult {
        let isValid: TValid = 1,
            propertyTypeSpecificValues: PropertyTypeSpecificValue[] = [],
            propertyTypeObjectValues: PropertyTypeValueObject[] = [],
            propertyTypes: PropertyType[] = [];
        propertyTypeValues.map(propertyTypeValue => {
            if (typeof propertyTypeValue === "string" || typeof propertyTypeValue === "number" || typeof propertyTypeValue === "boolean") propertyTypeSpecificValues.push(propertyTypeValue);
            else if (typeof propertyTypeValue === "function") propertyTypeObjectValues.push(propertyTypeValue as PropertyTypeValueObject);
            else propertyTypes.push(propertyTypeValue);
        });
        let mapDataResult = mapDataFromPropertyValueLiteral(dest, propertyTypeSpecificValues as PropertyTypeSpecificValue[], name, value, required);
        if (!mapDataResult.isValid) mapDataResult = mapDataFromPropertyValueLiteral(dest, propertyTypeObjectValues as PropertyTypeValueObject[], name, value, required);
        if (!mapDataResult.isValid) mapDataResult = mapDataFromPropertyValueLiteral(dest, propertyTypes as PropertyType[], name, value, required);
        isValid *= mapDataResult.isValid;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function mapDataForSingle(source, dest, property: IProperty): IMapDataResult {
        let isValid: TValid = 1;
        let delimiter = Object.__base__getDelimiter(property.name);
        if (source) {
            let value = Object.__base__valueAt(source, property.name, delimiter);
            if(property.type.value === PropertyTypes.Any){
                dest[property.name] = value;
            }
            else {
                let propertyTypeValue = property.type.value as PropertyTypeValueObject,
                    mapDataResult = mapDataFromPropertyValueObject(dest, propertyTypeValue, property.name, value, property.required);
                isValid = mapDataResult.isValid;   
            }
        }
        else if(!(NullOrUndefined(source)) || (NullOrUndefined(source) && property.required)) isValid *= 0;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function mapDataForList(source, dest, property: IProperty): IMapDataResult {
        let isValid: TValid = 1;
        let delimiter = Object.__base__getDelimiter(property.name);
        if (source) {
            let value = Object.__base__valueAt(source, property.name, delimiter);
            if(property.type.value === PropertyTypes.Any){
                dest[property.name] = value;
            }
            else {
                let propertyTypeValue = property.type.value as (PropertyTypeValueObject | PropertyTypeLiteral | PropertyTypeList),
                    mapDataResult = mapDataFromPropertyValueList(dest, propertyTypeValue, property.name, value, property.required);
                isValid *= mapDataResult.isValid;
            }
        }
        else if(!(NullOrUndefined(source)) || (NullOrUndefined(source) && property.required)) isValid *= 0;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function mapDataForLiteral(source, dest, property: IProperty): IMapDataResult {
        let isValid: TValid = 1;
        let delimiter = Object.__base__getDelimiter(property.name);
        if (source) {
            let value = Object.__base__valueAt(source, property.name, delimiter);
            if(property.type.value === PropertyTypes.Any){
                dest[property.name] = value;
            }
            else {
                let propertyTypeValues = property.type.value as PropertyTypeValue[],
                    mapDataResult = prepareMapDataForLiteral(dest, propertyTypeValues, property.name, value, property.required);
                isValid *= mapDataResult.isValid;
            }
        }
        else if(!(NullOrUndefined(source)) || (NullOrUndefined(source) && property.required)) isValid *= 0;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    function mapDataForMap(source, dest, property: IProperty): IMapDataResult {
        let isValid: TValid = 1;
        let delimiter = Object.__base__getDelimiter(property.name);
        if (source) {
            let value = Object.__base__valueAt(source, property.name, delimiter);
            if(property.type.value === PropertyTypes.Any){
                dest[property.name] = value;
            }
            else {
                let propertyTypeValue = property.type.value as (PropertyTypeValueObject | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList),
                    mapDataResult = mapDataFromPropertyValueMap(dest, propertyTypeValue, property.name, value, property.required);
                isValid *= mapDataResult.isValid;
            }
        }
        else if(!(NullOrUndefined(source)) || (NullOrUndefined(source) && property.required)) isValid *= 0;
        return MapDataResult.toResult(dest, isValid as TValid);
    }
    global["mapData"] = function mapData<T>(ConcreteClass: { new(...args: any[]): T }, inputSource: any, parentField: string = null): ResultTypeWrapper<T> {
        let properties = getProperties(ConcreteClass),
            isValid = 1,
            result = {},
            missingFields = [],
            wrongFields = [],
            source = Object.__base__clone(inputSource);
        properties.map(property => {
            let checkValidCondition = property.required === false || (property.required && property.name === "$_all" && source && Object.keys(source).length > 0) || (property.required && source && source[property.name]);
            if (checkValidCondition) isValid *= 1;
            else {
                if (property.name === "$_all" && parentField) missingFields.push(`${parentField}`);
                else {
                    if (parentField) missingFields.push(`${parentField}.${property.name}`);
                    else missingFields.push(property.name === "$_all" ? "" : property.name);
                }
                isValid *= 0;
            }
        });
        if (isValid) {
            result = new ConcreteClass();
            if(properties.length === 0) result = source;
            else {
                properties.map(property => {
                    if(property.name !== "$_all"){
                        if (property.type.type === "single") {
                            let mapDataResult = mapDataForSingle(source, result, property);
                            if (!mapDataResult.isValid) {
                                if (parentField) wrongFields.push(`${parentField}.${property.name}`);
                                else wrongFields.push(property.name);
                            }
                            isValid *= mapDataResult.isValid;
                        }
                        else if (property.type.type === "list") {
                            let mapDataResult = mapDataForList(source, result, property);
                            if (!mapDataResult.isValid) {
                                if (parentField) wrongFields.push(`${parentField}.${property.name}`);
                                else wrongFields.push(property.name);
                            }
                            isValid *= mapDataResult.isValid;
                        }
                        else if (property.type.type === "literal") {
                            let mapDataResult = mapDataForLiteral(source, result, property);
                            if (!mapDataResult.isValid) {
                                if (parentField) wrongFields.push(`${parentField}.${property.name}`);
                                else wrongFields.push(property.name);
                            }
                            isValid *= mapDataResult.isValid;
                        }
                        else {
                            let mapDataResult = mapDataForMap(source, result, property);
                            if (!mapDataResult.isValid) {
                                if (parentField) wrongFields.push(`${parentField}.${property.name}`);
                                else wrongFields.push(property.name);
                            }
                            isValid *= mapDataResult.isValid;
                        }
                    }
                    else {
                        let keys = Object.keys(source);
                        if (property.type.type === "single") {
                            keys.map((key) => {
                                let tempProperty: IProperty = Object.__base__clone<IProperty>(property);
                                tempProperty.name = key;
                                let mapDataResult = mapDataForSingle(source, result, tempProperty);
                                if (!mapDataResult.isValid) {
                                    if (parentField) wrongFields.push(`${parentField}.${key}`);
                                    else wrongFields.push(key);
                                }
                                isValid *= mapDataResult.isValid;
                            });
                        }
                        else if(property.type.type === "list"){
                            keys.map((key) => {
                                let tempProperty: IProperty = Object.__base__clone<IProperty>(property);
                                tempProperty.name = key;
                                let mapDataResult = mapDataForList(source, result, tempProperty);
                                if (!mapDataResult.isValid) {
                                    if (parentField) wrongFields.push(`${parentField}.${key}`);
                                    else wrongFields.push(key);
                                }
                                isValid *= mapDataResult.isValid;
                            }); 
                        }
                        else if(property.type.type === "literal"){
                            keys.map((key) => {
                                let tempProperty: IProperty = Object.__base__clone<IProperty>(property);
                                tempProperty.name = key;
                                let mapDataResult = mapDataForLiteral(source, result, tempProperty);
                                if (!mapDataResult.isValid) {
                                    if (parentField) wrongFields.push(`${parentField}.${key}`);
                                    else wrongFields.push(key);
                                }
                                isValid *= mapDataResult.isValid;
                            }); 
                        }
                        else {
                            keys.map((key) => {
                                let tempProperty: IProperty = Object.__base__clone<IProperty>(property);
                                tempProperty.name = key;
                                let mapDataResult = mapDataForMap(source, result, tempProperty);
                                if (!mapDataResult.isValid) {
                                    if (parentField) wrongFields.push(`${parentField}.${key}`);
                                    else wrongFields.push(key);
                                }
                                isValid *= mapDataResult.isValid;
                            }); 
                        }
                    }
                });
            }
        }
        if (isValid) {
            return ResultTypeWrapper.wrap<T>(result as T);
        }
        else {
            let errorString = "";
            if (missingFields.length > 0) errorString += `Missing field${missingFields.length > 1 ? "s" : ""} ${missingFields.join(", ")}`;
            if (wrongFields.length > 0) errorString += errorString ? `. Invalid field${wrongFields.length > 1 ? "s" : ""} ${wrongFields.join(", ")}` : `Invalid field${wrongFields.length > 1 ? "s" : ""} ${wrongFields.join(", ")}`;
            return ResultTypeWrapper.wrap(new Error(errorString));
        }
    }
};
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
};

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

if ("undefined" === typeof global["Context"]){
    class Context implements IContext{
        clone(): IContextProperty {
            throw new Error("Method not implemented.");
        }
        toJSON(): string {
            throw new Error("Method not implemented.");
        }
        fromJSON(input: string): IContextProperty {
            throw new Error("Method not implemented.");
        }
        init(input: Partial<IContextProperty>): void {
            throw new Error("Method not implemented.");
        }
        getType(): IClassType {
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
                if (!current) {
                    current = new Context({
                        value: {},
                        type: type,
                        resource: resource,
                        manual: false,
                        prev: null
                    });
                }
                current.value = parent.value || {};
                current.manual = false;
                current.prev = triggerId;
                current.held = parent.held || false;
                current.resourceId = parent.resourceId || undefined;
                let hasParentResource = true;
                if(!current.resourceId && current.resourceId !== 0) {
                    current.resourceId = namespace.currentValueIndex++;   
                    parent.resourceId = current.resourceId;   
                    hasParentResource = false;
                }
                if(!namespace.valueContexts[current.resourceId]) {
                    namespace.valueContexts[current.resourceId] = {
                        sharedHolders: [asyncId],
                        value: {}
                    }
                }
                else {
                    namespace.valueContexts[current.resourceId].sharedHolders.push(asyncId);
                }
                if(!hasParentResource && parent){
                    namespace.valueContexts[current.resourceId].sharedHolders.push(triggerId);
                }
                namespace.setById(asyncId, current);
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(asyncId);
                namespace.setById(triggerId, parent);
            }
        }

        function destroy(asyncId) {
            namespace.flush(asyncId, true);
        }

        function after(asyncId) {
            namespace.flush(asyncId);
        }

        function promiseResolve(asyncId) {
            namespace.flush(asyncId);
        }

        const asyncHook = asyncHooks.createHook({ init, destroy, after, promiseResolve });
    
        asyncHook.enable();
    }
}

if("undefined" === typeof global["Namespace"]){
    class Namespace implements INamespace{
        private static namespaces: {} = {};
        static create(name: string): INamespace {
            if (Namespace.namespaces[name]) {
                throw new Error(`A namespace for \${name} is already exists`);
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
            setInterval(() => {
                this.clearValueContext();
            }, 5000);
        }
        currentValueIndex: number = 0;
        valueContexts: { 
            [key: string]: { 
                value: any; 
                sharedHolders: number[];
            };
        } = {};
        private clearValueContext(){
            let keys = Object.keys(this.valueContexts);
            let start = Number(keys[0]);
            for(let i = start; i <= this.currentValueIndex; i++){
                let valueContext = this.valueContexts[i.toString()];
                if(valueContext){
                    let valueKeys = Object.keys(valueContext.value || {});
                    if(valueKeys.length === 0){
                        valueContext.sharedHolders.map(sharedHolder => {
                            this.flush(sharedHolder, true);
                        });
                    }
                }
            }
        }
        cloneById(sourceId: number) {
            let source = this.getById(sourceId);
            let destValue = Object.__base__clone(source.value);
            let dest = new Context({
                children: [],
                flushed: false,
                held: false,
                manual: true,
                prev: null,
                value: destValue,
                type: source.type,
                resource: source.resource ? Object.__base__clone(source.resource) : undefined,
                resourceId: source.resourceId
            });
            this.setById(asyncHooks.triggerAsyncId(), dest);
        }

        holdById(id: number) {
            let current = this.getById(id);
            if (current) {
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
    
        run(func: Function): Promise<void> {
            let asyncId = asyncHooks.executionAsyncId();
            let triggerId = asyncHooks.triggerAsyncId();
            let parent = this.getById(triggerId);
            while(!parent && triggerId > 0){
                triggerId--;
                parent = this.getById(triggerId);
            }
            if (parent) {
                // Here we keep passing the context from 
                // the triggerId to the new asyncId
                let current = this.getById(asyncId);
                if (!current) {
                    current = new Context({
                        value: {},
                        manual: false,
                        prev: null
                    });
                }
                current.value = parent.value || {};
                current.manual = true;
                current.prev = triggerId;
                current.held = parent.held || false;
                current.resourceId = parent.resourceId;
                if (current.resourceId || current.resourceId === 0) this.valueContexts[current.resourceId].sharedHolders.push(asyncId);
                else {
                    current.resourceId = this.currentValueIndex++;
                    parent.resourceId = current.resourceId;
                    this.valueContexts[current.resourceId] = {
                        sharedHolders: [triggerId, asyncId],
                        value: {}
                    }
                }
                this.setById(asyncId, current);
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(asyncId);
                this.setById(triggerId, parent);
            }
            else {
                let current = this.getById(asyncId);
                if (!current) {
                    current = new Context({
                        value: {},
                        manual: false,
                        prev: null
                    });
                }
                current.value = {};
                current.manual = true;
                if (!current.resourceId && current.resourceId !== 0) {
                    current.resourceId = this.currentValueIndex;
                    this.valueContexts[this.currentValueIndex++] = {
                        value: {},
                        sharedHolders: [asyncId]
                    };
                }
                this.setById(asyncId, current);
            }
            if (func instanceof AsyncFunction) {
                return func();
            }
            else {
                return new Promise((resolve, reject) => {
                    try {
                        func();
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            }
        }

        getById(id: number): IContext {
            return this.context[id];
        }
        setById(id: number, value: IContext): void {
            if(!value.resourceId && value.resourceId !== 0){
                value.resourceId = this.currentValueIndex++;
            }
            if(this.valueContexts[value.resourceId]){
                this.valueContexts[value.resourceId].value = value.value;
            }
            else {
                this.valueContexts[value.resourceId] = {
                    sharedHolders: [id],
                    value: value.value
                }
            }
            this.context[id] = value;

        }
        removeById(id: number, key = undefined) {
            let current = this.context[id];
            if(current){
                if(current.value){
                    delete current.value[key];
                }
                if(current.resourceId || current.resourceId === 0) {
                    if(this.valueContexts[current.resourceId]){
                        delete this.valueContexts[current.resourceId].value[key];
                    }
                }
            }
        }
    
        set(key, value) {
            const eid = asyncHooks.executionAsyncId();
            if (!this.context[eid]) {
                this.context[eid] = new Context({
                    value: {},
                    manual: true,
                    prev: asyncHooks.triggerAsyncId()
                });
            }
            let current = this.context[eid];
            current.manual = true;
            if (!current.resourceId && current.resourceId !== 0) {
                let parent = this.context[current.prev];
                current.resourceId = parent ? parent.resourceId : undefined;
                if (!current.resourceId && current.resourceId !== 0) {
                    current.resourceId = this.currentValueIndex++;
                }
            }
            if (this.valueContexts[current.resourceId]) {
                if (!this.valueContexts[current.resourceId].sharedHolders.includes(eid)) this.valueContexts[current.resourceId].sharedHolders.push(eid);
                this.valueContexts[current.resourceId].value[key] = value;
            }
            else {
                this.valueContexts[current.resourceId] = {
                    sharedHolders: [eid],
                    value: {}
                }
                this.valueContexts[current.resourceId].value[key] = value;
            }

            this.context[eid]["value"] = this.valueContexts[current.resourceId].value;
        }

        setValueById(id: number, key, value){
            let current = this.getById(id);
            if(!current.resourceId && current.resourceId !== 0){
                current.resourceId = this.currentValueIndex++;
            }
            if(!this.valueContexts[current.resourceId]){
                this.valueContexts[current.resourceId] = {
                    sharedHolders: [id],
                    value: {}
                }
            }
            this.valueContexts[current.resourceId].value[key] = value;
            current.value[key] = value;
            this.context[id] = current;
        }

        get<T>(key): T {
            const eid = asyncHooks.executionAsyncId();
            let current = this.getById(eid);
            if(current){
                if(current.value){
                    return current.value[key] as T;
                }
            }
            return null;
        }

        getValueById<T>(id: number, key): T {
            const current = this.getById(id);
            if(current) {
                if(current.value){
                    return current.value[key] as T;
                }
            }
            return null;
        }
    
        remove(key) {
            const eid = asyncHooks.executionAsyncId();
            let current = this.getById(eid);
            if(current){
                if(current.value){
                    delete current.value[key];
                }
                if(current.resourceId || current.resourceId === 0){
                    if(this.valueContexts[current.resourceId]){
                        delete this.valueContexts[current.resourceId].value[key];
                    }
                }
            }
            this.setById(eid, current);
        }
    
        flush(id, force = false) {
            let current = this.getById(id);
            if(current && force){
                if(current.resourceId || current.resourceId === 0) {
                    if(this.valueContexts[current.resourceId]){
                        this.valueContexts[current.resourceId].sharedHolders.map((sharedHolder, i, arr) => {
                            if(sharedHolder === id){
                                arr.splice(i, 1);
                            }
                        });
                        if(this.valueContexts[current.resourceId].sharedHolders.length === 0){
                            delete this.valueContexts[current.resourceId];
                        }
                    }
                }
                (current.children || []).map(childId => {
                    this.flush(childId, force);
                });
                delete this.context[id];
            }
        }
    
        dispose(){
            this.context = {};
        }
    }
    global["Namespace"] = Namespace;
};

if("undefined" === typeof global["LOGGER_SERVICE"]){
    global["LOGGER_SERVICE"] = "ILogger";
}

if("undefined" === typeof global["LOGGER_UTILS"]){
    global["LOGGER_UTILS"] = {
        reset: "\x1b[0m",
        bright: "x1b[1m",
        dim: "\x1b[2m",
        bold: "\u001b[1m",
        underline: "\x1b[4m",
        blink: "\x1b[5m",
        reverse: "\x1b[7m",
        hidden: "\x1b[8m",
        fgblack: "\x1b[30m",
        fgred: "\x1b[31m",
        fggreen: "\x1b[32m",
        fgyellow: "\x1b[33m",
        fgblue: "\x1b[34m",
        fgmagenta: "\x1b[35m",
        fgcyan: "\x1b[36m",
        fgwhite: "\x1b[37m",
        bgblack: "\x1b[40m",
        bgred: "\x1b[41m",
        bggreen: "\x1b[42m",
        bgyellow: "\x1b[43m",
        bgblue: "\x1b[44m",
        bgmagenta: "\x1b[45m",
        bgcyan: "\x1b[46m",
        bgwhite: "\x1b[47m"
    };
}

if("undefined" === typeof global["FONT_COLOR_DEFAULT"]){
    global["FONT_COLOR_DEFAULT"] = ["red", "green", "yellow", "blue", "magenta", "cyan", "white"];
}

if("undefined" === typeof global["FONT_COLOR_DEFAULT_LENGTH"]){
    global["FONT_COLOR_DEFAULT_LENGTH"] = FONT_COLOR_DEFAULT.length; 
}


if("undefined" === typeof global["logger"]){
    class Logger implements ILogger, IBaseClass<ILoggerProperty> {
        static maxLength: number = 0;
        private logColor: boolean;
        private tracing: boolean;
        private eventInstance: EventEmitter;
        private appName: string;
        private displayAppName: string;
        private showAppName: boolean;
        private currentLogLevel: "silly" | "info" | "debug" | "warn" | "error";
        private logLevels = {
            silly: ["silly", "info", "debug", "warn", "error"],
            info: ["info", "debug", "warn", "error"],
            debug: ["info", "debug", "warn", "error"],
            warn: ["info", "warn", "error"],
            error: ["info", "error"]
        }
        private on(event: "data", listener: (data: string) => void): ILogger {
            this.eventInstance.on(event, listener);
            return this;
        }
        private loggable(level: "silly" | "debug" | "error" | "info" | "warn"){
            return this.tracing && this.logLevels[this.currentLogLevel].includes(level);
        }
        private styleMessage(style: Partial<IMessageStyle>){
            let outputString: string = "";
            if(this.logColor){
                if (style.bold) {
                    outputString += `${LOGGER_UTILS.bold}`;
                }
                if (style.underline) {
                    outputString += `${LOGGER_UTILS.underline}`;
                }
                if (style.fontColor) {
                    outputString += `${LOGGER_UTILS["fg" + style.fontColor]}`;
                }
                if (style.backgroundColor) {
                    outputString += `${LOGGER_UTILS["bg" + style.backgroundColor]}`;
                }
            }
            return outputString;
        }
        expand(): ILogger {
            let newLogInstance = getDependency<ILogger>(LOGGER_SERVICE, true);
            newLogInstance.init({appName: this.appName, logColor: this.logColor});
            newLogInstance.trace(this.tracing);
            newLogInstance.setLevel(this.currentLogLevel);
            newLogInstance.setColor(this.logColor);
            newLogInstance.setDisplayAppName(this.showAppName);
            return newLogInstance;
        }
        setColor(logColor: boolean) {
            this.logColor = logColor;
        }
        setDisplayAppName(showAppName: boolean){
            this.showAppName = showAppName;
        }
        setLevel(level: "silly" | "debug" | "error" | "info" | "warn") {
            this.currentLogLevel = level;
        }
        pushLog(log: ILog);
        pushLog(message: string, level: "silly" | "debug" | "error" | "info" | "warn", tag: string, style?: IMessageStyle);
        pushLog(arg0: (string | ILog), arg1?: "silly" | "debug" | "error" | "info" | "warn", arg2?: string, arg3?: IMessageStyle) {
            if (typeof arg0 === "string" && this.loggable(arg1)) {
                let outputString = "";
                let message = arg0 as string;
                let level = arg1 as "silly" | "debug" | "error" | "info" | "warn";
                let tag = arg2 as string;
                let style = arg3 as IMessageStyle;
                if (style) {
                    outputString += this.styleMessage(style);
                }
                let date = new Date();
                let dateString = `${this.styleMessage({fontColor: "cyan"}) + date.toISOString()}(${date.toLocaleString()})${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let prefix = `${this.styleMessage({fontColor: "white"})}SILLY`;
                if (level === "debug") {
                    prefix = `${this.styleMessage({fontColor: "blue"})}DEBUG`;
                }
                else if (level === "info") {
                    prefix = `${this.styleMessage({fontColor: "green"})} INFO`;
                }
                else if (level === "error") {
                    prefix = `${this.styleMessage({fontColor: "red"})}ERROR`;
                }
                else if (level === "warn"){
                    prefix = `${this.styleMessage({fontColor: "yellow"})} WARN`;
                }
                prefix += `${this.logColor ? LOGGER_UTILS.reset : ""}`;
                message = `${outputString}${message}${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let resultString = (this.showAppName ? `${this.displayAppName} - ` : "" ) + `${dateString} - ${prefix}${tag ? " - [" + tag + "]" : ""} - ${message}`;
                this.eventInstance.emit("data", resultString);
            }
            else if(arg0 && this.loggable((<ILog>arg0).level)){
                let log = arg0 as ILog;
                let messageText = [];
                let tag = log.message.tag;
                log.message.messages.map(message => {
                    let outputString = "";
                    if (message.style) {
                        outputString += this.styleMessage(message.style);
                    }
                    outputString += message.text + `${this.logColor ? LOGGER_UTILS.reset : ""}`;
                    messageText.push(outputString);
                });
                let date = new Date();
                let dateString = `${this.styleMessage({fontColor: "cyan"})}${date.toISOString()}(${date.toLocaleString()})${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let prefix = `${this.styleMessage({fontColor: "white"})}SILLY`;
                if (log.level === "debug") {
                    prefix = `${this.styleMessage({fontColor: "blue"})}DEBUG`;
                }
                else if (log.level === "info") {
                    prefix = `${this.styleMessage({fontColor: "green"})} INFO`;
                }
                else if (log.level === "error") {
                    prefix = `${this.styleMessage({fontColor: "red"})}ERROR`;
                }
                else if (log.level === "warn"){
                    prefix = `${this.styleMessage({fontColor: "yellow"})} WARN`;
                }
                prefix += `${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let resultString = (this.showAppName ? `${this.displayAppName} - ` : "" ) + `${dateString} - ${prefix}${tag ? " - [" + tag +"]" : ""} - ${messageText.join(log.message.delimiter)}`;
                this.eventInstance.emit("data", resultString);
            }
        }
        pushWarn(message: string, tag: string) {
            this.pushLog(message, "warn", tag, { fontColor: "yellow" });
        }
        pushError(message: string, tag: string){
            this.pushLog(message, "error", tag, { fontColor: "red" });
        }
        pushSilly(message: string, tag: string) {
            this.pushLog(message, "silly", tag, { fontColor: "white" });
        }
        pushDebug(message: string, tag: string) {
            this.pushLog(message, "debug", tag, { fontColor: "blue" });
        }
        pushInfo(message: string, tag: string){
            this.pushLog(message, "info", tag, { fontColor: "green" });
        }
        trace(tracing: boolean) {
            this.tracing = tracing;
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
                if(message !== "\n"){
                    message = message.replace(/[\n\n]/g, "\n");
                    if(message.lastIndexOf("\n") !== message.length - 1){
                        message += "\n";
                    }
                }
                process.stdout.write(message);
            });
            this.showAppName = true;
            this.logColor = true;
            this.currentLogLevel = "silly";
        }
        init(input: Partial<ILoggerProperty>){
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
                this.displayAppName = `${this.styleMessage({fontColor: fontColor})}${input.appName}${this.logColor ? LOGGER_UTILS.reset : ""}`;
            }
        }
        
    }
    Injectable(LOGGER_SERVICE, true, true)(Logger);
    global["logger"] = getDependency<ILogger>(LOGGER_SERVICE);
    
    logger.trace(true);
    logger.setColor(true);
    logger.setDisplayAppName(true);
    
    console.log = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushSilly(outputString, "system");
        }
        catch(e){
            system.error(e);
            system.log.apply(console, arguments);
        }
    }
    console.warn = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushWarn(outputString, "system");
        }
        catch(e){
            system.warn.apply(console, arguments);
        }
    }
    console.error = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushError(outputString, "system");
        }
        catch(e){
            system.error.apply(console, arguments);
        }
    }
    console.debug = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushDebug(outputString, "system");
        }
        catch(e){
            system.debug.apply(console, arguments);
        }
    }
    console.info = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushInfo(outputString, "system");
        }
        catch(e){
            system.info.apply(console, arguments);
        }
    }
}

if("undefined" === typeof global["generateLog"]) {
    function convertFunction(input){
        Object.keys(input || {}).map(k => {
            if(typeof input[k] === "function"){
                input[k] = `[Function ${input[k].name}]`;
            }
            else if(typeof input[k] === "object"){
                input[k] = convertFunction(input[k]);
            }
        });
        return input;
    }
    global["generateLog"] = function(): string{
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
            else if(BaseError.isInstance(arguments[key])){
                let error: IBaseError = arguments[key];
                if(!error.logged){
                    outputMessage.push(error.stack);
                    error.logged = true;
                }
            }
            else if(arguments[key] instanceof Error){
                outputMessage.push(arguments[key].stack);
            }
            else if(typeof arguments[key] === "object"){
                // let arg = Object.__base__clone(arguments[key]);
                let  arg = arguments[key];
                if(typeof arg.toString === "function" && !Array.isArray(arg) && arg.toString() !== "[object Object]") outputMessage.push(arg.toString());
                else outputMessage.push(JSON.__base__circularStringify(arg));    
            }
            else {
                outputMessage.push(arguments[key]);
            }
        }
        let outputString = outputMessage.join(" ").trim();
        return outputString;
    }
};
if("undefined" === typeof global["ErrorLevel"]){
    class ErrorLevel implements IErrorLevel {
        level: TErrorLevel;
        static RED: IErrorLevel;
        static GREEN: IErrorLevel;
        static isInstance(input: any): boolean {
            if(input && input.level === "red" || input.level === "green"){
                return true;
            }
            return false;
        }
        static asInstance(input: any){
            return input;
        }
        static has(input, key: string): boolean {
            if(input && input[key]){
                return true;
            }
            return false;
        }
    }
    const redLevel = new ErrorLevel();
    redLevel.level = "red";
    const greenLevel = new ErrorLevel();
    greenLevel.level = "green";
    global["ErrorLevel"] = ErrorLevel;
    global["ErrorLevel"].RED = redLevel;
    global["ErrorLevel"].GREEN = greenLevel;
}
if ("undefined" === typeof global["BaseError"]) {
    class BaseError extends Error implements IBaseError {
        code: number;
        specificCode: number;
        name: string;
        message: string;
        stack?: string;
        level: TErrorLevel;
        logged: boolean;

        static isInstance(input: any): boolean{
            let isValid = 1;
            if(input && input instanceof Error){
                let keys = ["code", "specificCode", "name", "message", "level", "stack", "logged"];
                keys.map(key => {
                    isValid *= this.has(input, key) ? 1 : 0;
                });
                if(isValid) return true;
            }
            return false;
        }

        static has(input: any, key: string): boolean {
            if(input && typeof input[key] !== "undefined" && input[key] !== null){
                return true;
            }
            return false;
        }

        static asInstance(input: any){
            return input;
        }

        constructor(message: string);

        constructor(message: string, level: "red" | "green");
        constructor(code: number, message: string);

        constructor(code: number, specificCode: number, message: string);
        constructor(code: number, message: string, level: IErrorLevel);

        constructor(code: number, specificCode: number, message: string, level: "red" | "green");
        constructor(arg0: number | string, arg1?: number | string | IErrorLevel, arg2?: string | IErrorLevel, arg3?: string | IErrorLevel) {
            if (arguments.length === 4) {
                super(arg2 as string);
                this.code = arg0 as number;
                this.specificCode = arg1 as number;
                this.level = ErrorLevel.asInstance(arg3).level;
            }
            else if (arguments.length === 3) {
                if (ErrorLevel.isInstance(arg2)) {
                    super(arg1 as string);
                    this.code = arg0 as number;
                    this.specificCode = arg1 as number;
                    this.level = ErrorLevel.asInstance(arg2).level;
                }
                else {
                    super(arg2 as string);
                    this.code = arg0 as number;
                    this.specificCode = arg1 as number;
                    this.level = "green";
                }
            }
            else if (arguments.length === 2) {
                if (ErrorLevel.isInstance(arg1)) {
                    super(arg1 as string);
                    this.code = 0;
                    this.specificCode = 0;
                    this.level = ErrorLevel.asInstance(arg1).level;
                }
                else {
                    super(arg1 as string);
                    this.code = arg0 as number;
                    this.specificCode = arg0 as number;
                    this.level = "green";
                }
            }
            else {
                super(arg0 as string);
                this.code = 500;
                this.specificCode = 500;
                this.level = "green";
            }
            this.logged = false;
        }
    }
    global["BaseError"] = BaseError;
}

if ("undefined" === typeof global["handleError"]) {
    global["handleError"] = function handleError(e: Error | IBaseError, messageOrErrorLevel: (string | IErrorLevel)): IBaseError {
        let baseError: IBaseError;

        if (e instanceof Error && !BaseError.isInstance(e)) {
            if (messageOrErrorLevel){
                if(ErrorLevel.isInstance(messageOrErrorLevel)) {
                    baseError = new BaseError(e.message, ErrorLevel.asInstance(messageOrErrorLevel));
                    baseError.stack = e.stack;
                }
                else {
                    baseError = new BaseError(e.message);
                    baseError.stack = e.stack;
                    let message = baseError.message + " --> " + messageOrErrorLevel as string;
                    baseError.stack = baseError.stack.replace(baseError.message, message);
                    baseError.message = message;
                }
            }
            else {
                baseError = new BaseError(e.message);
                baseError.stack = e.stack;
            }
        }
        else {
            baseError = e as IBaseError;
            if (messageOrErrorLevel) {
                if(ErrorLevel.isInstance(messageOrErrorLevel)) {
                    if (baseError.level === "green") baseError.level = ErrorLevel.asInstance(messageOrErrorLevel).level;
                }
                else {
                    let message = baseError.message + " --> " + messageOrErrorLevel as string;
                    baseError.stack = baseError.stack.replace(baseError.message, message);
                    baseError.message = message;
                }
            }            
        }
        process.emit("app-error", baseError);
        return baseError;
    }
}

if("undefined" === typeof global["ResultTypeWrapper"]){
    class ResultTypeWrapper<T> implements IResultTypeWrapper<T> {
        value: T;        
        error: IBaseError;
        static wrap<T>(_error: (Error | IBaseError)): IResultTypeWrapper<T>;
        static wrap<T>(_value: T): IResultTypeWrapper<T>;
        static wrap<T>(input: (Error | IBaseError) | T): IResultTypeWrapper<T>{
            let result = new ResultTypeWrapper<T>();
            if(input instanceof Error || BaseError.isInstance(input)){
                result.error = handleError(input as (Error | IBaseError));
            }
            else {
                result.value = input as T;
            }
            return result;
        }
    }
    global["ResultTypeWrapper"] = ResultTypeWrapper;
};

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
};
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
};
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
    Object.defineProperty(Object, "__base___clone", {
        writable: false,
        configurable: false,
        value: function(source: any, cache = [], destCache = [], parentKey = ""){
            let dest;
            if(typeof source !== "undefined" && source !== null){
                if(cache.length === 0){
                    cache.push(source)
                    destCache.push("root");
                }
                if (typeof source === "object" && typeof source.__base__clone === "function"){
                    dest = source.__base__clone();
                }
                else {
                    if(Array.isArray(source)) dest = [];
                    else dest = {};
                    let keys = Object.keys(source);
                    Object.values(source).map((value, index) => {
                        if (value && typeof value === "object") {
                            let key = parentKey ? `${parentKey}.${keys[index]}` : "root." + keys[index];
                            cache.push(value);
                            destCache.push(key);
                        }
                    });
                    Object.values(source).map((value, index) => {
                        if (value && typeof value === "object") {
                            let matchIndex = cache.indexOf(value);
                            let key = parentKey ? `${parentKey}.${keys[index]}` : "root." + keys[index];
                            if(matchIndex >= 0 && destCache[matchIndex] !== key) {
                                dest[keys[index]] = destCache[matchIndex];
                            }
                            else {
                                if(typeof value["__base__clone"] === "function") dest[keys[index]] = value["__base__clone"]();
                                else dest[keys[index]] = Object["__base___clone"](value, cache, destCache, key);
                            }
                        }
                        else {
                            dest[keys[index]] = value;
                        }
                    });
                }
            }
            return dest
        }
    });
    Object.defineProperty(Object, "__base__after__clone", {
        writable: false,
        configurable: false,
        value: function(source: any, cache, parentKey = "root"){
            if(typeof source !== "undefined" && source !== null){
                if(!cache) cache = { root: source };
                Object.keys(source).map(key => {
                    if(typeof source[key] === "object"){
                        let tempKey = `${parentKey}.${key}`;
                        cache[tempKey] = source[key];
                    }
                });
                Object.keys(source).map(key => {
                    if(typeof source[key] === "object"){
                        let tempKey = `${parentKey}.${key}`;
                        cache[tempKey] = source[key];
                        source[key] = Object["__base__after__clone"](source[key], cache, tempKey);
                    }
                    else if(typeof source[key] === "string"){
                        let cacheValue = cache[source[key]];
                        if(cacheValue) source[key] = cacheValue;
                    }
                });
            } 
            return source;
        }
    });
    Object.__base__clone = function <T>(source: any): T {
        let dest;
        if (source) {
            dest = Object["__base___clone"](source);
            dest = Object["__base__after__clone"](dest);   
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
        let temp = (source || []).slice(0);
        return temp.map(t => {
            if (typeof t === "object") return Object.__base__clone(t);
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
// };
// ===================================================== Map ==============================================
if ("undefined" === typeof Map.prototype.__base__clone) {
    Map.prototype.__base__clone = function <K, V>(this: Map<K, V>): Map<K, V> {
        let newMap = new Map();
        this.forEach((value, key) => {
            newMap.set(key, value);
        });
        return newMap;
    }
}
if ("undefined" === typeof Map.prototype.__base__toJSON) {
    Map.prototype.__base__toJSON = function (this: Map<any, any>): string {
        let temp = this.__base__convertToObject(true);
        let jsonString = `Map(${JSON.__base__circularStringify(temp)})`;
        return jsonString;
    }
}
if ("undefined" === typeof Map.prototype.__base__convertToObject) {
    Map.prototype.__base__convertToObject = function <K, V>(this: Map<K, V>, nested: boolean = false): V {
        let obj = {};
        this.forEach((value, key) => {
            let keyString = "";
            if (typeof key === "string") {
                keyString = key;
            }
            else {
                keyString = key.toString();
            }
            if (value instanceof Map) {
                if (nested) obj[keyString] = value.__base__convertToObject();
                else obj[keyString] = value;
            }
            else {
                obj[keyString] = value;
            }
        });
        return obj as V;
    }
}
if ("undefined" === typeof Map.__base__fromObject) {
    Map.__base__fromObject = function <V>(obj: any): Map<keyof V, V[keyof V]> {
        const newMap = new Map();
        if (obj) {
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
if ("undefined" === typeof Map.__base__fromJSON) {
    Map.__base__fromJSON = function (input: string): Map<any, any> {
        input = input.replace("Map(", "");
        input = input.substring(0, input.length - 1);
        let obj = JSON.__base__circularParse(input);
        let temp = Map.__base__fromObject<any>(obj);
        return temp;
    }
};
// =================================================== Date ==============================================
if ("undefined" === typeof Date.__base__fromJSON) {
    Date.__base__fromJSON = function (input: string): Date {
        input = input.replace(/[(Date)\(\)]/g, "");
        return new Date(input);
    }
}
if ("undefined" === typeof Date.prototype.__base__toJSON) {
    Date.prototype.__base__toJSON = function(): string {
        return `Date(${this.toISOString()})`;
    }
}

if ("undefined" === typeof Date.prototype.__base__clone) {
    Date.prototype.__base__clone = function(): Date{
        return new Date(this);
    }
};;

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
};

if(typeof global["process-watch-log"] === "undefined") {
    global["process-watch-log"] = true;
    process.once("exit", (code: number) => {
        if(code === 1111){
            process.stdout.write("╔══════════════════════════════════════════════════════════════╗\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║           App shutdown with error has level 'RED'            ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("╚══════════════════════════════════════════════════════════════╝\n");
        }
        else {
            let errorString = `App shutdown with error has code  ${code}`;
            let space = "              ";
            let codeString = code.toString();
            let spaceLength = space.length;
            let odd = (codeString.length % 2 !== 0);
            let leftSpaceLength = odd ? spaceLength - Math.floor(codeString.length / 2) - 1 : spaceLength - Math.floor(codeString.length / 2);
            let rightSpaceLength = spaceLength - Math.floor(codeString.length / 2);
            errorString = space.substring(0, leftSpaceLength) + errorString + space.substring(0,  rightSpaceLength);
            process.stdout.write("╔══════════════════════════════════════════════════════════════╗\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write(`║${errorString}║\n`);
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("╚══════════════════════════════════════════════════════════════╝\n");
        }
    }).on("uncaughtException", (err) => {
        console.error(err);
        handleError(err as Error, ErrorLevel.RED);
    }).on("unhandledRejection", (err) => {
        console.error(err);
        handleError(err as Error, ErrorLevel.RED);
    }).on("app-error", (err) => {
        console.error(err);
        let error = err as IBaseError;
        if(error.level === "red"){
            process.exit(1111);
        }
    });
}

// class Test {
//     @Property(String, {required: false})
//     a: string;
//     @Property(Number, {required: false})
//     b: number;
//     @Property(Date, {required: true})
//     c: Date;
//     @Property(PropertyArray(String), {required: true})
//     d: Array<String>;
// }

// class Test1 {
//     @Property(Test, {required: true})
//     a: Test;
//     @Property(PropertyMap(PropertyMap(Number)))
//     b: Map<string, Map<string, number>>;
//     // @Property(PropertyMap(Number))
//     // b: Map<string, number>;
// }

// let t = new Test();
// let value = {a: "a", b: 15, c: new Date(), d: ["a", "b", "c", "d", "e"]};
// let data = mapData<Test>(Test, value);
// if(data.error){
//     handleError(data.error, ErrorLevel.RED);
// }
// else {
//     t = data.value;
// }

// console.debug(t);

// let t1 = new Test1();
// let s = {a: t, b: new Map()};
// let temp = new Map();
// temp.set("a", 0).set("b", 1).set("c", 2).set("d", 3);
// s.b.set("a", temp).set("b", temp).set("c", temp);
// // s.b.set("a", 0).set("b", 1).set("c", 2).set("d", 3);
// let data1 = mapData<Test1>(Test1, s);
// if(data1.error){
//     handleError(data1.error, ErrorLevel.RED);
// }
// else {
//     t1 = data1.value;
// }
// console.debug(t1);
// let JSONT1 = JSON.__base__circularStringify(t1);
// console.debug(JSONT1);
// let ObjT1 = JSON.__base__circularParse(JSONT1);
// console.debug(ObjT1);

// =======================================================
// =======================================================
// =======================================================
// =======================================================

// class Test {
//     @Property(String)
//     a: string;
//     @Property(Number)
//     b: number;
// }


// @DynamicProperty(PropertyTypes.Any, {required: true})
// class Test1 {
//     [key: string]: any;
// }


// let t = new Test();
// t.a = "a";
// t.b = 0;

// let t1 = new Test1();
// let value = {a: "a", b: 0, c: false};
// let data = mapData<Test1>(Test1, value);
// if(data.error) handleError(data.error, ErrorLevel.RED);
// else t1 = data.value;
// console.log(t1);