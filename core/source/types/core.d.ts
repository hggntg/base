interface JSON {
    circularToken: Symbol;
    circularStringify(value: any): string;
    circularParse<T>(value: string): T;
}

interface ObjectConstructor {
    clone<T>(source: any): T;
    replace<T>(input: any, condition: any, replacer: any): T;
    valueAt(source: any, key: string);
    noMap<V>(input: any): V; 
}

interface Map<K, V> {
    convertToObject<V>(): V;
    clone(): Map<K, V>;
}

interface MapConstructor {
    fromObject<V>(obj: any): Map<keyof V, V[keyof V]>;
}

declare function isPathMatchesAlias(path: string, alias: string): boolean;
declare function addAlias(alias: string, target: string): void;
declare function wrapInTryCatch<T>(fn: Function): T;
declare function defaultValue(input: any, type: "boolean" | "string" | "number" | "object" | "array", truthy?: boolean): any;
declare function mapData<T>(ClassImp: { new(): T }, source: any, parentField?: string): T;
declare function mapBasicType(source: any, type: PropertyTypeValue): any;
declare class BaseClass<T> implements IBaseClass<T>{
    getType(): IClassType;
    init(input: Partial<T>): void;
}