import "reflect-metadata";
import { REQUIRES_KEY } from "../../shared/constant";
import { getClass, getMetadata } from "../../utilities/class";

export interface RequireProperty{
    [key: string] : boolean;
}

export function Required(target: object, propertyKey: string){
    let requires: RequireProperty = Reflect.getMetadata(REQUIRES_KEY, target.constructor);
    if(!requires){
        requires = {};
    }
    requires[propertyKey] = true;
    Reflect.defineMetadata(REQUIRES_KEY, requires, target.constructor);
}

export function checkRequire(target: any){
    let classImp = getClass(target);
    let requires = getMetadata(REQUIRES_KEY, classImp);
    return requires;
}
