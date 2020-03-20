import { injectable, inject, named } from "inversify";
import { registerDependency, generateNewableIdentifier, checkDependency, registerDependencyAgain } from "@app/utilities/class";

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