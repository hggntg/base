import { PropertyType } from "@app/internal";

export interface IPropertyDecorator{
    (target: object, propertyKey: string): any;
}
export interface IParameterDecorator{
    (target: Object, propertyKey: string, parameterIndex?: number): any;
}


export interface IProperty{
    type: PropertyType | string[],
    name: string;
    required: boolean;
}

export interface INamespace extends IBaseClass<any>{
    run(func: Function) : Promise<void>;
    set(key, value): void;
    getById(id: number): IContext;
    setById(id: number, value: IContext): void;
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
export interface INamespaceStatic {
    create(name: string): INamespace;
    get(name: string): INamespace;
    new(): INamespace;
}

export interface IContextValue{
    value?: any;
    type?: any;
    resource?: any;
    prev?: number;
    children?: Array<number>;
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
}

export interface IContextOriginValue{
    value?: any;
    prev?: number;
    children?: Array<number>;
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
}

export interface IContextProperty{
    value?: any;
    type?: any;
    resource?: any;
    prev?: number;
    children?: Array<number>;
    manual?: boolean;
    held?: boolean;
    flushed?: boolean;
}

export interface IContext extends IBaseClass<IContextProperty>, IContextProperty{
    rawValue(): IContextValue;
    originValue(): IContextOriginValue;
}

export interface ISearchInput{
    pageSize?:  number;
    pageIndex?: number;
    fields?:    string;
    sort?:      any;
    filter?:    any;    
}