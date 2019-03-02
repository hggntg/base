import "reflect-metadata";
export declare function getClass(target: any): {
    new (): any;
};
export declare function getMetadata(key: string | Symbol, classImp: Function): any;
export declare function defineMetadata(key: string | Symbol, value: any, classImp: Function): void;
