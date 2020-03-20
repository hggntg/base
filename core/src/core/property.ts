if ("undefined" === typeof global["typeKey"]) {
    global["typeKey"] = "Type";
}

if ("undefined" === typeof global["PropertyTypes"]) {
    enum PropertyTypes {
        Any = "$$_any"
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
    global["PropertyArray"] = function PropertyArray(type: { new(...args: any[]): any } | PropertyTypeLiteral | PropertyTypeList): PropertyType {
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
    global["PropertyLiteral"] = function PropertyLiteral(type: PropertyTypeValue, ...moreType: PropertyTypeValue[]) {
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
}