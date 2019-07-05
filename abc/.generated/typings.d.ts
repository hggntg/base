/// <reference path="E:/repo/base/abc/node_modules/@types/node/index.d.ts" />
interface Function {
    getType(): IType
}

interface IBaseClass{
    getType(): IType;
}

interface ITypeInfo{
    name: string;
    kind: string;
    properties?: ITypeInfo[];
}

interface IGlobalType{
    [key : string]: ITypeInfo;
}

interface IType {
    getKind(): string;
    getName(): string;
    getProperties(): ITypeInfo[];
    of(name: string): boolean;
}