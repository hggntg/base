import "reflect-metadata";
export interface RequireProperty {
    [key: string]: boolean;
}
export declare function Required(target: object, propertyKey: string): void;
export declare function checkRequire(target: any): any;
