import "reflect-metadata";
import { PROPERTIES_KEY } from "../shared/constant";
import { IProperty } from "../interface";
import { Container } from "inversify";


export function getProperties(target: any): IProperty[] {
    let properties = getMetadata<IProperty[]>(PROPERTIES_KEY, target);
    return properties || [];
}

export function generateNewableIdentifier(identifier: symbol | string) {
    let newableIdentifier: symbol | string = null;
    if (typeof identifier === "string") {
        newableIdentifier = `Newable<${identifier}>`;
    }
    else {
        let symbolString = identifier.toString().replace("Symbol(", "").replace(")", "");
        newableIdentifier = Symbol.for(`Newable<${symbolString}>`);
    }
    return newableIdentifier;
}

export function bindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean){
    if(typeof newable === "undefined"){
        newable = true;
    }
    if(isDefault){
        container.bind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
        if(newable){
            container.bind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
        }
    }
    else{
        container.bind<T>(identifier).to(service).inSingletonScope().whenTargetNamed(service.name);
        if(newable){
            container.bind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetNamed(service.name);
        }
    }
}

export function bindConstantToContainer<T>(container: Container, identifier: symbol | string, constantValue: T, name?: string){
    if(!name){
        container.bind<T>(identifier).toConstantValue(constantValue);
    }
    else{
        container.bind<T>(identifier).toConstantValue(constantValue).whenTargetNamed(name);
    }
}

export function rebindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean){
    if(typeof newable === "undefined"){
        newable = true;
    }
    let allBinders = container.getAll(identifier);
    let reBinders = [];
    allBinders.map((binder) => {
        reBinders.push(Object.getPrototypeOf(binder).constructor);
    });

    if(isDefault){
        container.rebind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
    }
    else{
        container.rebind<T>(identifier).to(service).inSingletonScope().whenTargetNamed(service.name);
    }

    reBinders.map((binderClass) => {
        container.bind<T>(identifier).to(binderClass).inSingletonScope().whenTargetNamed(binderClass.name);
    });

    if(newable){
        let allNewableBinders = container.getAll(generateNewableIdentifier(identifier));
        let reNewableBinders = [];
        allNewableBinders.map((newableBinder) => {
            reNewableBinders.push(Object.getPrototypeOf(newableBinder).constructor);
        });

        if(isDefault){
            container.rebind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
        }
        else{
            container.rebind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetNamed(service.name);
        }    

        reNewableBinders.map((newBinderClass) => {
            container.bind<T>(generateNewableIdentifier(identifier)).to(newBinderClass).inTransientScope().whenTargetNamed(newBinderClass.name);
        });
    }
}

export function registerDependency<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean,  isDefault?: boolean) {
    if(typeof newable === "undefined"){
        newable = true;
    }
    let container: Container = getMetadata("DI", global);
    if (!container) {
        container = new Container();
    }
    if (isDefault) {
        try {
            container.get(identifier);
            // let allBinders = container.getAll(identifier);
            // let reBinders = [];
            // allBinders.map((binder) => {
            //     reBinders.push(Object.getPrototypeOf(binder).constructor);
            // });
            // container.rebind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
            // container.rebind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
            // reBinders.map((binderClass) => {
            //     container.bind<T>(identifier).to(binderClass).inSingletonScope().whenTargetNamed(binderClass.name);
            //     container.bind<T>(generateNewableIdentifier(identifier)).to(binderClass).inTransientScope().whenTargetNamed(binderClass.name);
            // });
            rebindToContainer<T>(container, identifier, service, newable, isDefault);
        }
        catch (e) {
            bindToContainer<T>(container, identifier, service, newable, isDefault);
            // container.bind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
            // container.bind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
        }
    }
    else {
        bindToContainer<T>(container, identifier, service, newable, isDefault);
    }
    defineMetadata("DI", container, global);
}

export function registerConstant<T>(identifier: symbol | string, constantValue: T, name?: string){
    let container: Container = getMetadata("DI", global);
    if (!container) {
        container = new Container();
    }
    return bindConstantToContainer(container, identifier, constantValue, name);
}


export function getDependency<T>(identifier: symbol | string): T;
export function getDependency<T>(identifier: symbol | string, name: string): T;
export function getDependency<T>(identifier: symbol | string, newable: boolean): T;
export function getDependency<T>(identifier: symbol | string, name: string, newable: boolean): T;
export function getDependency<T>(identifier: symbol | string, newable: boolean, name: string): T;
export function getDependency<T>(identifier: symbol | string, arg0?: string | boolean, arg1?: string | boolean): T {
    let numOfArgs = arguments.length;
    let container: Container = getMetadata("DI", global);
    if (!container) {
        throw new Error("DI Container is not exists");
    }
    else {
        let name: string = null;
        let newable: boolean = false;
        if (numOfArgs === 2) {
            if (typeof arg0 === "string") {
                name = arg0;
            }
            else {
                newable = arg0;
            }
        }
        else {
            if (typeof arg0 === "string") {
                name = arg0;
            }
            else {
                newable = arg0;
            }
            if (typeof arg1 === "string") {
                name = arg1;
            }
            else {
                newable = arg1;
            }
        }
        if (name) {
            if (newable) {
                return container.getNamed(generateNewableIdentifier(identifier), name);
            }
            else {
                return container.getNamed(identifier, name);
            }
        }
        else {
            if (newable) {
                return container.get(generateNewableIdentifier(identifier));
            }
            else {
                return container.get(identifier);
            }
        }
    }
}

export function getConstant<T>(identifier: symbol | string, name?: string): T{
    let container: Container = getMetadata("DI", global);
    if (!container) {
        throw new Error("DI Container is not exists");
    }
    if(name){
        return container.getNamed(identifier, name);
    }
    else{
        return container.get(identifier);
    }
}

export function checkConstant(identifier: symbol | string, name?: string): boolean{
    let container: Container = getMetadata("DI", global);
    if (container) {
        try{
            let fakeConstant = null;
            if(name){
                fakeConstant = container.getNamed(identifier, name);
            }
            else{
                fakeConstant = container.get(identifier);
            }
            return !!fakeConstant;
        }
        catch(e){
            return false;
        }
    }
    return false;
}

export function checkDependency(identifier: symbol | string, newable: boolean = false, name?: string){
    let container: Container = getMetadata("DI", global);
    if(container){
        try{
            let fakeDependency = null;
            if (name) {
                if (newable) {
                    fakeDependency = container.getNamed(generateNewableIdentifier(identifier), name);
                }
                else {
                    fakeDependency = container.getNamed(identifier, name);
                }
            }
            else {
                if (newable) {
                    fakeDependency = container.get(generateNewableIdentifier(identifier));
                }
                else {
                    fakeDependency = container.get(identifier);
                }
            }
            return !!fakeDependency;
        }
        catch(e){
            return false;
        }
    }
    return false;
}

export function extendClass(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            if (name !== 'constructor') {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            }
        });
    });
}