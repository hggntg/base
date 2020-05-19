/// <reference types="node" />
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
declare let Type: IGlobalType;
interface IIntrinsicType {
    kind: "intrinsic";
    name: "string" | "number" | "any" | "void" | "number" | "object" | "array" | "boolean";
}

interface IInterfaceType {
    kind: "interface";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extends: IInterfaceType[];
}


interface IPropertyType {
    kind: "property";
    name: string;
    type: IInterfaceType | IIntrinsicType;
    optional: boolean;
}

interface IMethodType {
    kind: "method";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
    returnType: IIntrinsicType | IInterfaceType;
    optional: boolean;
}

interface IConstructorType {
    kind: "construct";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
}

interface IClassType {
    kind: "class";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extend: IClassType;
    implements: IInterfaceType[];
    constructors: IConstructorType[];
}

interface IGlobalType {
    declare(type: IClassType | IInterfaceType | IConstructorType | IIntrinsicType | IMethodType | IPropertyType): void;
    get(name: string, kind?: string): IClassType | IInterfaceType | IConstructorType | IIntrinsicType | IMethodType | IPropertyType;
    compare(input: any, name: string, kind?: string): boolean;
    has(name: string, kind: string): boolean;
}

interface IBaseClass<T> {
    getType?(): IClassType;
    init?(input: Partial<T>): void;
    clone?(): T;
    toJSON?(): string;
}

interface IExtendBaseClass<T>{
    __base__getType(): IClassType;
    __base__init(input: Partial<T>): void;
    __base__clone(): T;
    __base__toJSON(): string;
}

declare function extendClass(derivedCtor: { new(...args): any }, baseCtors: { new(...args): any }, ...moreBaseCtors: { new(...args): any }[]);
declare function getClass(target: any): { new(...args: any[]): any };

// interface IBaseClassConstructor<S, T, R> {
//     clone<S>(source: T): R;
//     toJSON<S>(source: T): string;
//     fromJSON(input: string): R;
//     replace<S>(input: T, condition: any, replacer: any): R;
//     valueAt<S>(source: any, key: string): R;
//     setAt(source: any, key: string | number, value: any);
//     flattenMap<S>(input: any): R;
// }
type TErrorLevel = "red" | "green";

interface IErrorLevel {
    level: TErrorLevel;
}

interface ErrorLevelConstructor extends IBaseConstructor<IErrorLevel>{
    RED: IErrorLevel;
    GREEN: IErrorLevel;
}

declare var ErrorLevel: ErrorLevelConstructor;

interface IBaseError extends Error, IErrorLevel {
    code: number;
    specificCode: number;
    logged: boolean;
}
interface IResultTypeWrapper<T>{
    value: T;
    error: IBaseError;
}
declare class ResultTypeWrapper<T>  implements IResultTypeWrapper<T> {
    value: T;    
    error: IBaseError;
    static wrap<T>(_error: Error | IBaseError): IResultTypeWrapper<T>;
    static wrap<T>(_value: T): IResultTypeWrapper<T>;
    static wrap<T>(input: (Error | IBaseError) | T): IResultTypeWrapper<T>;

}

interface BaseErrorConstructor extends IBaseConstructor<IBaseError> {
    new(message: string): IBaseError;
        
    new(message: string, level: TErrorLevel): IBaseError;
    new(code: number, message: string): IBaseError;

    new(code: number, specificCode: number, message: string): IBaseError;
    new(code: number, message: string, level: TErrorLevel): IBaseError;
    
    new(code: number, specificCode: number, message: string, level: IErrorLevel): IBaseError;
    new(arg0: number | string, arg1?: number | string | IErrorLevel, arg2?: string | IErrorLevel, arg3?: IErrorLevel): IBaseError;
}
    
declare var BaseError: BaseErrorConstructor;

declare function handleError(e: Error | IBaseError, extendedMessage?: string): IBaseError;
declare function handleError(e: Error | IBaseError, errorLevel?: IErrorLevel): IBaseError;
declare function handleError(e: Error | IBaseError, extendedMessage?: string | IErrorLevel): IBaseError;
type TColor = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white";

interface IMessageStyle {
    bold?: boolean,
    underline?: boolean,
    fontColor?: TColor,
    backgroundColor?: TColor
}

interface IMessageSegment {
    tag: string;
    messages: Array<IMessage>;
    delimiter: string;
}

interface IMessage {
    text: string;
    style?: IMessageStyle;
}
interface ILog {
    level: "silly" | "debug" | "error" | "info" | "warn",
    message: IMessageSegment,
    htmlString?: string,
    metadata?: any
}

interface ILoggerProperty{
    appName: string;
    logColor: boolean;
}

interface ILogger extends IBaseClass<ILoggerProperty> {
    pushLog(log: ILog);
    pushLog(message: string, level: "silly" | "debug" | "error" | "info" | "warn", tag: string, style?: IMessageStyle);
    pushWarn(message: string, tag: string);
    pushError(message: string, tag: string);
    pushSilly(message: string, tag: string);
    pushDebug(message: string, tag: string);
    pushInfo(message: string, tag: string);
    trace(isTrace: boolean);
    setColor(logColor: boolean);
    setDisplayAppName(showAppName: boolean);
    setLevel(level: "silly" | "debug" | "error" | "info" | "warn");
    expand(): ILogger;
}


interface ILoggerUtils {
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
}

declare function generateLog(): string;
declare const LOGGER_SERVICE: "ILogger";
declare const LOGGER_UTILS: ILoggerUtils;
declare const logger: ILogger;
declare const FONT_COLOR_DEFAULT: ["red", "green", "yellow", "blue", "magenta", "cyan", "white"];
declare const FONT_COLOR_DEFAULT_LENGTH: number;
declare type Container = any;
declare function generateNewableIdentifier(identifier: symbol | string);
declare function bindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function bindConstantToContainer<T>(container: Container, identifier: symbol | string, constantValue: T, name?: string);
declare function rebindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function registerDependency<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function registerDependencyAgain<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function registerConstant<T>(identifier: symbol | string, constantValue: T, name?: string);
declare function getDependency<T>(identifier: symbol | string): T;
declare function getDependency<T>(identifier: symbol | string, name: string): T;
declare function getDependency<T>(identifier: symbol | string, newable: boolean): T;
declare function getDependency<T>(identifier: symbol | string, name: string, newable: boolean): T;
declare function getDependency<T>(identifier: symbol | string, newable: boolean, name: string): T;
declare function getConstant<T>(identifier: symbol | string, name?: string): T;
declare function checkConstant(identifier: symbol | string, name?: string): boolean;
declare function checkDependency(identifier: symbol | string, newable: boolean, name?: string);
declare function Injectable<T>(serviceName: string, newable?: boolean, isDefault?: boolean);
declare function getMetadata<T>(key: string | Symbol, target: any);
declare function defineMetadata (key: string | Symbol, value: any, target: any);
interface INamespace extends IBaseClass<INamespace>{
    currentValueIndex: number;
    valueContexts: {
        [key: string]: {
            value: any,
            sharedHolders: number[]
        };
    }
    run(func: Function) : Promise<void>;
    set(key, value): void;
    getById(id: number): IContext;
    setById(id: number, value: IContext): void;
    removeById(id: number, key?): void;
    holdById(id: number): void;
    cloneById(sourceId: number  ): void;
    get<T>(key): T;
    flush(id: number, force?: boolean): void;
    remove(key): void;
    dispose(): void; 
    rawValue(): {
        [key in string]: IContextValue
    };
    originValue():{
        [key in string]: IContextOriginValue
    }
    getCurrentId(): number;
    getParentId(): number;
}
interface INamespaceStatic {
    create(name: string): INamespace;
    get(name: string): INamespace;
    destroy(name: string);
    new(): INamespace;
}

interface IContextValue{
    value?: any;
    type?: any;
    resource?: any;
    prev?: number;
    children?: Array<number>;
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
    resourceId?: number;
}

interface IContextOriginValue{
    value?: any;
    prev?: number;
    children?: Array<number>;
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
}

interface IContextProperty{
    value?: any;
    type?: any;
    resource?: any;
    prev?: number;
    children?: Array<number>;
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
    resourceId?: number;
}

interface IContext extends IBaseClass<IContextProperty>, IContextProperty{
    rawValue(): IContextValue;
    originValue(): IContextOriginValue;
}

declare function createHooks(namespace: INamespace): void;
declare class Context implements IContext {
    getType(): IClassType;
    init(input: Partial<IContextProperty>): void;
    clone(): IContextProperty; toJSON(): string;
    fromJSON(input: string): IContextProperty;
    init(input: Partial<IContextProperty>): void;
    rawValue(): IContextValue;
    originValue(): IContextOriginValue;
    initValue(input: Partial<IContextProperty>): void;
    value?: any;
    type?: any;
    resource?: any;
    prev?: number;
    children?: number[];
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
    constructor();
    constructor(input: IContextValue);
    constructor(input?: IContextValue);
}
declare const Namespace: INamespaceStatic;

/*

interface INamespaceStatic {
    create(name: string): INamespace;
    get(name: string): INamespace;
    destroy(name: string);
    new(): INamespace;
}





interface IContext extends IBaseClass<IContextProperty>, IContextProperty{
    rawValue(): IContextValue;
    originValue(): IContextOriginValue;
}

declare function createHooks(namespace: INamespace): void;
declare class Context implements IContext {
    getType(): IClassType;
    init(input: Partial<IContextProperty>): void;
    clone(): IContextProperty; toJSON(): string;
    fromJSON(input: string): IContextProperty;
    init(input: Partial<IContextProperty>): void;
    rawValue(): IContextValue;
    originValue(): IContextOriginValue;
    initValue(input: Partial<IContextProperty>): void;
    value?: any;
    type?: any;
    resource?: any;
    prev?: number;
    children?: number[];
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
    constructor();
    constructor(input: IContextValue);
    constructor(input?: IContextValue);
}
*/
interface IPropertyDecorator {
    (target: object, propertyKey: string): any;
}
interface IParameterDecorator {
    (target: Object, propertyKey: string, parameterIndex?: number): any;
}

declare enum PropertyTypes {
    Any = "$_any"
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
type TWatcherEvent = "STOP"; 

declare interface IWatcher {
    emit(events: TWatcherEvent, id: string): void;
    init(): void;
    joinFrom(id: string): void;
}

declare module NodeJS {
    interface Process {
        watcher: IWatcher;
    }
}


declare namespace NodeJS {
    interface Process {
        emit(event: "app-error", error: IBaseError): boolean;
        on(event: "app-error", listener: NodeJS.AppErrorListener): Process;
    }
    type AppErrorListener = (error: IBaseError) => void;
}