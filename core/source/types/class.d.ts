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