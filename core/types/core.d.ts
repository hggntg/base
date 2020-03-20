interface IBaseJSON {
    __base__circularToken: Symbol;
    __base__circularStringify(value: any): string;
    __base__circularParse<T>(value: string): T;
}

interface JSON extends IBaseJSON { }

interface IBaseObjectConstructor{
    __base__clone<T>(source: T): T;
    __base__toJSON(source: any): string;
    __base__fromJSON<T>(input: string): T;
    __base__replace<T>(input: any, condition: any, replacer: any): T;
    __base__valueAt<T>(input: any, key: string, delimiter?: string): T;
    __base__setAt(souce: any, key: string | number, value: any, delimiter?: string): void;
    __base__flattenMap<T>(input: any): T
    __base__getDelimiter(key: string): string;
}

interface ObjectConstructor extends IBaseObjectConstructor { }

interface IBaseArrayConstructor {
    __base__clone<T>(source: Array<T>): Array<T>;
    __base__toJSON(source: any): string;
    __base__fromJSON<T>(input: string): Array<T>;
}
interface ArrayConstructor extends IBaseArrayConstructor { }

interface IBaseMap<K, V> extends IExtendBaseClass<Map<K, V>> {
    __base__convertToObject<V>(nested?: boolean): V;
}
interface Map<K, V> extends IBaseMap<K, V> { }

interface IBaseDateConstructor {
    __base__fromJSON(input: string): Date;
}
interface DateConstructor extends IBaseDateConstructor { }
interface IBaseDate extends IExtendBaseClass<Date> {}
interface Date extends IBaseDate { }

interface IBaseMapConstructor {
    __base__fromObject<V>(obj: any): Map<keyof V, V[keyof V]>;
    __base__fromJSON<V>(input: string): Map<keyof V, V[keyof V]>;
}
interface MapConstructor extends IBaseMapConstructor { }

interface IBaseRegExp extends IExtendBaseClass<RegExp>{}
interface RegExp extends IBaseRegExp{}

declare function isPathMatchesAlias(path: string, alias: string): boolean;
declare function addAlias(alias: string, target: string): void;
declare function wrapInTryCatch<T>(fn: Function): T;

interface IBaseConstructor<T> {
    isInstance(input: any): boolean;
    asInstance(input: any): T;
    has(key: string | number): boolean;
}

interface ISystem {
    log: Console["log"];
    debug: Console["debug"];
    warn: Console["warn"];
    error: Console["error"];
    info: Console["info"];
}

declare const system: ISystem;