import "reflect-metadata";
import { REQUIRES_KEY, PROPERTIES_KEY } from "../../shared/constant";
import { RequireProperty } from "./require.decorator";
import { getClass, getMetadata } from "../../utilities/class";

export function Property(target: object, propertyKey: string) {
    let columns: string[] = Reflect.getMetadata(PROPERTIES_KEY, target.constructor) || [];
    let requires: RequireProperty = Reflect.getMetadata(REQUIRES_KEY, target.constructor);
    columns.push(propertyKey);
    if(!requires){
        requires = {};
    }
    if(!requires[propertyKey]){
        requires[propertyKey] = false;
    }
    Reflect.defineMetadata(PROPERTIES_KEY, columns, target.constructor);
    Reflect.defineMetadata(REQUIRES_KEY, requires, target.constructor);
}

export function getProperties(target: any) {
    let classImp = getClass(target);
    let properties = getMetadata(PROPERTIES_KEY, classImp);
    return  properties || [];
}