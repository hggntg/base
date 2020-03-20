interface IPropertyDecorator {
    (target: object, propertyKey: string): any;
}
interface IParameterDecorator {
    (target: Object, propertyKey: string, parameterIndex?: number): any;
}

declare enum PropertyTypes {
    Any = "$$_any"
}

type PropertyTypeValueObject = { new(...args: any[]): any };
type PropertyTypeSpecificValue = string | number | boolean;
type PropertyTypeValue = PropertyTypeValueObject | PropertyTypeSpecificValue;

type PropertyTypeSingle = { type: "single", value: PropertyTypeValueObject | PropertyTypes.Any};
type PropertyTypeList = { type: "list", value: PropertyTypeValueObject | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList | PropertyTypes.Any};
type PropertyTypeLiteral = { type: "literal", value: (PropertyTypeValue | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList | PropertyTypes.Any)[] };
type PropertyTypeMap = { type: "map", value: PropertyTypeValueObject | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList | PropertyTypes.Any};
type PropertyType = PropertyTypeSingle | PropertyTypeList | PropertyTypeLiteral | PropertyTypeMap;

declare function IsPropertyType(propertyType: any): boolean;
declare const typeKey = "Type";
declare const PROPERTIES_KEY: Symbol;
declare const REAL_DATA_TYPE_KEY: Symbol;

interface IProperty {
    type: PropertyType,
    name: string;
    required: boolean;
}
declare function getProperties(target: any): IProperty[];
declare function DynamicProperty(type: { new(...args: any[]): any } | PropertyType | PropertyTypes.Any, options?: {
    required?: boolean
});
declare function PropertyMap(type: { new(...args: any[]): any } | PropertyTypeMap | PropertyTypeList | PropertyTypeLiteral | PropertyTypes.Any): PropertyTypeMap;
declare function PropertyArray(type: { new(...args: any[]): any } | PropertyTypeMap | PropertyTypeList | PropertyTypeLiteral | PropertyTypes.Any): PropertyTypeList;
declare function PropertyLiteral(type: { new(...args: any[]): any } | string | number | boolean | PropertyTypeMap | PropertyTypeLiteral | PropertyTypeList | PropertyTypes.Any, ...moreType: ({ new(...args: any[]): any } | string | number | boolean | PropertyTypeLiteral | PropertyTypeList | PropertyTypes.Any)[]): PropertyTypeLiteral;
declare function Property(type: { new(...args: any[]): any } | PropertyType | PropertyTypes.Any, options?: {
    required?: boolean
});
declare function defaultValue(input: any, type: "boolean" | "string" | "number" | "object" | "array", truthy?: boolean): any;
declare function mapData<T>(ClassImp: { new(): T }, source: any, parentField?: string): ResultTypeWrapper<T>;