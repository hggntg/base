interface IPropertyDecorator{
    (target: object, propertyKey: string): any;
}
interface IParameterDecorator{
    (target: Object, propertyKey: string, parameterIndex?: number): any;
}

type PropertyTypeValue = {new(...args: any[]): any};
type PropertyType = {type: "single" | "list" | "literal" | "map", value: PropertyTypeValue | PropertyTypeValue[]};
declare const typeKey = "Type";
declare const PROPERTIES_KEY: Symbol;
declare const REAL_DATA_TYPE_KEY: Symbol;


interface IProperty{
    type: PropertyType | string[],
    name: string;
    required: boolean;
}
declare function defineRealDataType(target, type: "object" | "string" | "boolean" | "number");
declare function getRealDataType(target): string[];
declare function getProperties(target: any): IProperty[];
declare function DynamicProperty(type: { new(...args: any[]): any } | PropertyType, options?: {
    required?: boolean
});
declare function PropertyMap(type: { new(...args: any[]): any }): PropertyType;
declare function PropertyArray(type: { new(...args: any[]): any }): PropertyType;
declare function PropertyLiteral(type: { new(...args: any[]): any }, ...moreType: ({ new(...args: any[]): any })[]);
declare function Property(type: { new(...args: any[]): any } | PropertyType, options?: {
    required?: boolean
});