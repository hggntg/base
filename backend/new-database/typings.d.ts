/// <reference types="node" />
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
declare let Type: IGlobalType;
interface IIntrinsicType{
    kind: "intrinsic";
    name: "string" | "number" | "any" | "void" | "number" | "object" | "array" | "boolean";
}

interface IInterfaceType{
    kind: "interface";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extends:  IInterfaceType[];
}


interface IPropertyType{
    kind: "property";
    name: string;
    type: IInterfaceType | IIntrinsicType;
    optional: boolean;
}

interface IMethodType{
    kind: "method";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
    returnType: IIntrinsicType | IInterfaceType;
    optional: boolean;
}

interface IConstructorType{
    kind: "construct";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
}

interface IClassType{
    kind: "class";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extend: IClassType;
    implements: IInterfaceType[];
    constructors: IConstructorType[];
}

interface IGlobalType{
    declare(type: IClassType | IInterfaceType | IConstructorType | IIntrinsicType | IMethodType | IPropertyType): void;
    get(name: string, kind?: string): IClassType | IInterfaceType | IConstructorType | IIntrinsicType | IMethodType | IPropertyType;
    compare(input: any, name: string, kind?: string): boolean;
    has(name: string, kind: string): boolean;
}

interface IBaseClass<T>{
    getType(): IClassType;
    init(input: Partial<T>): void;
}

declare function extendClass(derivedCtor: { new(...args): any }, baseCtors: { new(...args): any }, ...moreBaseCtors: { new(...args): any }[]);
declare function getClass(target: any): { new(...args: any[]): any };
interface IBaseError extends Error {
    code: number;
    specificCode: number;
}

interface IErrorResultData {
    hasError: boolean;
    error: IBaseError;
}
declare type ResultTypeWrapper<T> = IErrorResult | T;
interface IErrorResult extends IBaseClass<IErrorResultData>, IErrorResultData {}

declare class BaseError extends Error implements IBaseError {
    code: number;    
    specificCode: number;
    name: string;
    message: string;
    stack?: string;

    constructor(message: string);
    constructor(code: number, message: string);
    constructor(code: number, specificCode: number, message: string);
    constructor(arg0: number | string, arg1?: number | string, arg2?: string);
}

declare function handleError(e: Error | IBaseError | IErrorResult, extendedMessage?: string): ResultTypeWrapper<any>;
declare class ErrorResult extends BaseClass<IErrorResultData> implements IErrorResult{
    hasError: boolean;
    error: IBaseError;
}
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
}

interface ILogger extends IBaseClass<ILoggerProperty> {
    pushLog(log: ILog);
    pushLog(message: string, level: "silly" | "debug" | "error" | "info", tag: string, style?: IMessageStyle);
    pushWarn(message: string, tag: string);
    pushError(message: string, tag: string);
    pushSilly(message: string, tag: string);
    pushDebug(message: string, tag: string);
    pushInfo(message: string, tag: string);
    trace(isTrace: boolean);
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
interface INamespace extends IBaseClass<any>{
    run(func: Function) : Promise<void>;
    set(key, value): void;
    getById(id: number): IContext;
    setById(id: number, value: IContext): void;
    removeById(id: number, key): void;
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
}

interface IContext extends IBaseClass<IContextProperty>, IContextProperty{
    rawValue(): IContextValue;
    originValue(): IContextOriginValue;
}

declare function createHooks(namespace: INamespace): void;
declare class Context implements IContext {
    init(input: Partial<IContextProperty>): void;
    rawValue(): IContextValue;
    originValue(): IContextOriginValue;
    getType(): IClassType;
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