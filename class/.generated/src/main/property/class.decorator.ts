import { injectable, inject, named } from "inversify";
import { registerDependency, generateNewableIdentifier, checkDependency, registerDependencyAgain } from "../../utilities/class";

export function Injectable<T>(serviceName: string, newable?: boolean, isDefault?: boolean) {
    return (target: any) => {
        injectable()(target);
        let targetClass = getClass(target);
        let isExists = checkDependency(serviceName, newable, targetClass.name);
        if(!isExists){
            registerDependency<T>(serviceName, targetClass, newable, isDefault);
        }
        else{
            registerDependencyAgain<T>(serviceName, targetClass, newable, isDefault);
        }
    }
}
export function use(serviceName: symbol | string);
export function use(serviceName: symbol | string, newable: boolean);
export function use(serviceName: symbol | string, name: string);
export function use(serviceName: symbol | string, newable: boolean, name: string);
export function use(serviceName: symbol | string, name: string, newable: boolean);
export function use(serviceName: symbol | string, arg0?: string | boolean, arg1?: string | boolean) {
    let numOfArgs = arguments.length;
    return function (target: Object, propertyKey: string, parameterIndex?: number) {
        let name: string = null;
        let newable: boolean = false;
        if (numOfArgs === 2) {
            if (typeof arg0 === "boolean") {
                newable = arg0;
            }
            else {
                name = arg0;
            }
        }
        else {
            if (typeof arg0 === "boolean") {
                newable = arg0;
            }
            else {
                name = arg0;
            }
            if (typeof arg1 === "boolean") {
                newable = arg1;
            }
            else {
                name = arg1;
            }
        }
        if (newable) {
            inject(generateNewableIdentifier(serviceName))(target, propertyKey, parameterIndex);
        }
        else {
            inject(serviceName)(target, propertyKey, parameterIndex);
        }
        if (name) {
            named(name);
        }
    }
}