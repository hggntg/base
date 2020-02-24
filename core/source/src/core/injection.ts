import "reflect-metadata";
import { injectable, Container } from "inversify";



if ("undefined" === typeof global["getMetadata"]) {
    global["getMetadata"] = function getMetadata<T>(key: string | Symbol, target: any) {
        return Reflect.getMetadata(key, getClass(target)) as T;
    }
}

if ("undefined" === typeof global["defineMetadata"]) {
    global["defineMetadata"] = function defineMetadata(key: string | Symbol, value: any, target: any) {
        return Reflect.defineMetadata(key, value, getClass(target));
    }
}

if ("undefined" === typeof global["generateNewableIdentifier"]) {
    global["generateNewableIdentifier"] = function generateNewableIdentifier(identifier: symbol | string) {
        let newableIdentifier: symbol | string = null;
        if (typeof identifier === "string") {
            newableIdentifier = `Newable<\${identifier}>`;
        }
        else {
            let symbolString = identifier.toString().replace("Symbol(", "").replace(")", "");
            newableIdentifier = Symbol.for(`Newable<\${symbolString}>`);
        }
        return newableIdentifier;
    }
}

if ("undefined" === typeof global["bindToContainer"]) {
    global["bindToContainer"] = function bindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        if (isDefault) {
            container.bind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
            if (newable) {
                container.bind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
            }
        }
        else {
            container.bind<T>(identifier).to(service).inSingletonScope().whenTargetNamed(service.name);
            if (newable) {
                container.bind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetNamed(service.name);
            }
        }
    }
}

if ("undefined" === typeof global["bindConstantToContainer"]) {
    global["bindConstantToContainer"] = function bindConstantToContainer<T>(container: Container, identifier: symbol | string, constantValue: T, name?: string) {
        if (!name) {
            container.bind<T>(identifier).toConstantValue(constantValue);
        }
        else {
            container.bind<T>(identifier).toConstantValue(constantValue).whenTargetNamed(name);
        }
    }
}

if ("undefined" === typeof global["rebindToContainer"]) {
    global["rebindToContainer"] = function rebindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        let allBinders = container.getAll(identifier);
        let reBinders = [];
        allBinders.map((binder) => {
            let binderContructor = Object.getPrototypeOf(binder).constructor;
            if (isDefault || (!isDefault && service.name !== binderContructor.name)) {
                reBinders.push(binderContructor);
            }
        });

        if (isDefault) {
            container.rebind<T>(identifier).to(service).inSingletonScope().whenTargetIsDefault();
        }
        else {
            container.rebind<T>(identifier).to(service).inSingletonScope().whenTargetNamed(service.name);
        }

        reBinders.map((binderClass) => {
            container.bind<T>(identifier).to(binderClass).inSingletonScope().whenTargetNamed(binderClass.name);
        });

        if (newable) {
            let allNewableBinders = container.getAll(generateNewableIdentifier(identifier));
            let reNewableBinders = [];
            allNewableBinders.map((newableBinder) => {
                let binderContructor = Object.getPrototypeOf(newableBinder).constructor;
                if (isDefault || (!isDefault && service.name !== binderContructor.name)) {
                    reNewableBinders.push(binderContructor);
                }
            });

            if (isDefault) {
                container.rebind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetIsDefault();
            }
            else {
                container.rebind<T>(generateNewableIdentifier(identifier)).to(service).inTransientScope().whenTargetNamed(service.name);
            }

            reNewableBinders.map((newBinderClass) => {
                container.bind<T>(generateNewableIdentifier(identifier)).to(newBinderClass).inTransientScope().whenTargetNamed(newBinderClass.name);
            });
        }
    }
}

if ("undefined" === typeof global["registerDependency"]) {
    global["registerDependency"] = function registerDependency<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        let container: Container = getMetadata("DI", global);
        if (!container) {
            container = new Container({skipBaseClassChecks: true});
        }
        if (isDefault) {
            try {
                container.get(identifier);
                rebindToContainer<T>(container, identifier, service, newable, isDefault);
            }
            catch (e) {
                bindToContainer<T>(container, identifier, service, newable, isDefault);
            }
        }
        else {
            bindToContainer<T>(container, identifier, service, newable, isDefault);
        }
        defineMetadata("DI", container, global);
    }

}

if ("undefined" === typeof global["registerDependencyAgain"]) {
    global["registerDependencyAgain"] = function registerDependencyAgain<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean) {
        if (typeof newable === "undefined") {
            newable = true;
        }
        let container: Container = getMetadata("DI", global);
        if (!container) {
            container = new Container({skipBaseClassChecks: true});
        }
        rebindToContainer<T>(container, identifier, service, newable, isDefault);
        defineMetadata("DI", container, global);
    }
}

if ("undefined" === typeof global["registerConstant"]) {
    global["registerConstant"] = function registerConstant<T>(identifier: symbol | string, constantValue: T, name?: string) {
        let container: Container = getMetadata("DI", global);
        if (!container) {
            container = new Container({skipBaseClassChecks: true});
        }
        return bindConstantToContainer(container, identifier, constantValue, name);
    }
}

// export function getDependency<T>(identifier: symbol | string): T;
// export function getDependency<T>(identifier: symbol | string, name: string): T;
// export function getDependency<T>(identifier: symbol | string, newable: boolean): T;
// export function getDependency<T>(identifier: symbol | string, name: string, newable: boolean): T;
// export function getDependency<T>(identifier: symbol | string, newable: boolean, name: string): T;
if ("undefined" === typeof global["getDependency"]) {
    global["getDependency"] = function getDependency<T>(identifier: symbol | string, arg0?: string | boolean, arg1?: string | boolean): T {
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
}

if ("undefined" === typeof global["getConstatnt"]) {
    global["getConstant"] = function getConstant<T>(identifier: symbol | string, name?: string): T {
        let container: Container = getMetadata("DI", global);
        if (!container) {
            throw new Error("DI Container is not exists");
        }
        if (name) {
            return container.getNamed(identifier, name);
        }
        else {
            return container.get(identifier);
        }
    }
}

if ("undefined" === typeof global["checkConstant"]) {
    global["checkConstant"] = function checkConstant(identifier: symbol | string, name?: string): boolean {
        let container: Container = getMetadata("DI", global);
        if (container) {
            try {
                let fakeConstant = null;
                if (name) {
                    fakeConstant = container.getNamed(identifier, name);
                }
                else {
                    fakeConstant = container.get(identifier);
                }
                return !!fakeConstant;
            }
            catch (e) {
                return false;
            }
        }
        return false;
    }
}

if ("undefined" === typeof global["checkDependency"]) {
    global["checkDependency"] = function checkDependency(identifier: symbol | string, newable: boolean = false, name?: string) {
        let container: Container = getMetadata("DI", global);
        if (container) {
            try {
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
            catch (e) {
                return false;
            }
        }
        return false;
    }
}

if ("undefined" === typeof global["extendClass"]) {
    global["extendClass"] = function extendClass(derivedCtor: { new(...args): any }, baseCtors: { new(...args): any }, ...moreBaseCtors: { new(...args): any }[]) {
        moreBaseCtors.unshift(baseCtors);
        moreBaseCtors.forEach(baseCtor => {
            let baseCtorProperties = getProperties(baseCtor);
            baseCtorProperties.map(property => {
                Property(property.type as PropertyType, { required: property.required })(derivedCtor, property.name);
            })
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
                if (name !== 'constructor') {
                    derivedCtor.prototype[name] = baseCtor.prototype[name];
                }
            });
        });
    }
}

if ("undefined" === typeof global["Injectable"]) {
    global["Injectable"] = function Injectable<T>(serviceName: string, newable?: boolean, isDefault?: boolean) {
        return (target: any) => {
            injectable()(target);
            let targetClass = getClass(target);
            let isExists = checkDependency(serviceName, newable, targetClass.name);
            if (!isExists) {
                registerDependency<T>(serviceName, targetClass, newable, isDefault);
            }
            else {
                registerDependencyAgain<T>(serviceName, targetClass, newable, isDefault);
            }
        }
    }
}