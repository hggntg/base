declare type Container = any;
declare function generateNewableIdentifier(identifier: symbol | string);
declare function bindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function bindConstantToContainer<T>(container: Container, identifier: symbol | string, constantValue: T, name?: string);
declare function rebindToContainer<T>(container: Container, identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function registerDependency<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function registerDependencyAgain<T>(identifier: symbol | string, service: new (...args: any[]) => T, newable?: boolean, isDefault?: boolean);
declare function registerConstant<T>(identifier: symbol | string, constantValue: T, name?: string);
declare function getDependency<T>(identifier: symbol | string): T;
declare function getDependency<T>(identifier: symbol | string, name: string): T;
declare function getDependency<T>(identifier: symbol | string, newable: boolean): T;
declare function getDependency<T>(identifier: symbol | string, name: string, newable: boolean): T;
declare function getDependency<T>(identifier: symbol | string, newable: boolean, name: string): T;
declare function getConstant<T>(identifier: symbol | string, name?: string): T;
declare function checkConstant(identifier: symbol | string, name?: string): boolean;
declare function checkDependency(identifier: symbol | string, newable: boolean, name?: string);
declare function Injectable<T>(serviceName: string, newable?: boolean, isDefault?: boolean);
declare function getMetadata<T>(key: string | Symbol, target: any);
declare function defineMetadata (key: string | Symbol, value: any, target: any);