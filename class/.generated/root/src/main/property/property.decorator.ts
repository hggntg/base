import { IProperty } from "@app/interface";
import { PROPERTIES_KEY, REAL_DATA_TYPE_KEY } from "@app/shared/constant";
import { PropertyType, PropertyTypeValue } from "@app/internal";

export function DynamicProperty(type: { new(...args: any[]): any } | PropertyType, options?: {
    required?: boolean
}){
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

export function PropertyArray(type: { new(...args: any[]): any }): PropertyType {
    return {
        type: "list",
        value: type
    } as PropertyType
}

export function PropertyLiteral(type: { new(...args: any[]): any }, ...moreType: ({ new(...args: any[]): any })[]){
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

export function Property(type: { new(...args: any[]): any } | PropertyType, options?: {
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

export function defineRealDataType(target, type: "object" | "string" | "boolean" | "number") {
    let types: string[] = getRealDataType(target) || [];
    if (!types.includes(type)) types.push(type);
    defineMetadata(REAL_DATA_TYPE_KEY, types, getClass(target));
}

export function getRealDataType(target): string[] {
    let realDataType = undefined;
    try {
        realDataType = getMetadata(REAL_DATA_TYPE_KEY, target) as string[];
    }
    catch (e) {
        realDataType = undefined;
    }
    return realDataType;
}