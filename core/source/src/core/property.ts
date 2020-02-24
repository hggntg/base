if ("undefined" === typeof global["typeKey"]){
    global["typeKey"] = "Type";
}

if ("undefined" === typeof global["PROPERTIES_KEY"]){
    global["PROPERTIES_KEY"] = Symbol.for("property");
}

if("undefined" === typeof global["CLASS_KEY"]){
    global["CLASS_KEY"] = Symbol.for("class");
}

if("undefined" === typeof global["REAL_DATA_TYPE_KEY"]){
    global["REAL_DATA_TYPE_KEY"] = Symbol.for("real-data-type");
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
        console.log(REAL_DATA_TYPE_KEY);
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