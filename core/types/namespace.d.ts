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