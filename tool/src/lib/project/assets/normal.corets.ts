export const corets =
`import "reflect-metadata";
import { join, sep, resolve, basename } from "path";
import BuiltInModule from "module";
const typeKey = "Type";

if("undefined" === typeof global["addAlias"]){
    const Module = module.constructor || BuiltInModule;
    const moduleAliasNames = [];
    const moduleAliases = {

    };

    global["addAlias"] = function addAlias (alias: string, target: string){
        moduleAliases[alias] = target;
        if(!moduleAliasNames.includes(alias)) moduleAliasNames.push(alias);
    }

    global["isPathMatchesAlias"] = function isPathMatchesAlias (path: string, alias: string) {
        // Matching /^alias(/|$)/
        if (path.indexOf(alias) === 0) {
            if (path.length === alias.length) return true
            if (path[alias.length] === '/') return true
        }

        return false
    }

    const oldResolveFilename = (<any>Module)._resolveFilename;
    (<any>Module)._resolveFilename = function (request, parentModule, isMain, options) {
        for (var i = moduleAliasNames.length; i-- > 0;) {
            var alias = moduleAliasNames[i];
            if (isPathMatchesAlias(request, alias)) {
                var aliasTarget = moduleAliases[alias];
                // Custom function handler
                if (typeof moduleAliases[alias] === 'function') {
                    let fromPath = parentModule.filename;
                    aliasTarget = moduleAliases[alias](fromPath, request, alias);
                    if (!aliasTarget || typeof aliasTarget !== 'string') {
                        throw new Error('[module-alias] Expecting custom handler function to return path.');
                    }
                }
                request = join(aliasTarget, request.substr(alias.length));
                // Only use the first match
                break;
            }
        }
        return oldResolveFilename.call(this, request, parentModule, isMain, options)
    }
}

if("undefined" === typeof global["getClass"]){
    global["getClass"] = function getClass(target: any): { new(...args: any[]): any } {
        if (target) {
            if (typeof target === "object" && typeof target.constructor === "function") {
                return target.constructor;
            }
            else {
                return target;
            }
        }
        else {
            throw new Error("Error target is undefined cannot identify a class");
        }
    }
}

if("undefined" === typeof global["getMetadata"]){
    global["getMetadata"] = function getMetadata<T>(key: string | Symbol, target: any) {
        return Reflect.getMetadata(key, getClass(target)) as T;
    }
}

if("undefined" === typeof global["defineMetadata"]){
    global["defineMetadata"] = function defineMetadata (key: string | Symbol, value: any, target: any) {
        return Reflect.defineMetadata(key, value, getClass(target));
    }
}


if("undefined" === typeof global["Type"]){
    type TType = {
        class: {
            [key: string]: IClassType
        },
        interface: {
            [key: string]: IInterfaceType
        },
        construct: {
            [key: string]: IConstructorType
        },
        intrinsic: {
            [key: string]: IIntrinsicType
        },
        method: {
            [key: string]: IMethodType
        },
        property: {
            [key: string]: IPropertyType
        }
    };
    global["Type"] = {
        compare(input: any, name: string, kind?: "class" | "construct" | "method" | "interface" | "property"): boolean{
            if(kind){
                let type = types[kind][name];
                let checked = false;
                console.log(input);
                console.log(type);
                switch(kind){
                    case "class":
                        break;
                    case "construct":
                        break;
                    case "interface":
                        break;
                    case "property":
                        break;
                    case "method":
                        break;
                    default:
                        break;
                }
                return checked;
            }
            else{
                if(name === "array"){
                    return Array.isArray(input);
                }
                return typeof input === name;
            }
        },
        has(name: string, kind: string): boolean{
            if(types[kind][name]){
                return true;
            }
            return false;
        },
        declare(type: IClassType | IInterfaceType | IConstructorType | IMethodType | IPropertyType){
            let checked = Type.has(type.name, type.kind);
            if(!checked){
                types[type.kind][type.name] = type;
                defineMetadata(typeKey, types, Type);
            }
        },
        get(name: string, kind?: "class" | "construct" | "method" | "interface" | "property"): IClassType | IInterfaceType | IConstructorType | IIntrinsicType | IMethodType | IPropertyType{
            if(kind){
                return types[kind][name];
            }
            else{
                return types.intrinsic[name];
            }
        }
    }
    let types: TType = getMetadata<TType>("Type", Type);
    if(!types){
        types = {
            class: {},
            interface: {},
            construct:{},
            method:{},
            property: {},
            intrinsic: {
                Any: {kind: "intrinsic", name: "any"},
                Void: {kind: "intrinsic", name: "void"},
                Number: {kind: "intrinsic", name: "number"},
                String: {kind: "intrinsic", name: "string"},
                Object: {kind: "intrinsic", name: "object"},
                Boolean: {kind: "intrinsic", name: "boolean"},
                Array: {kind: "intrinsic", name: "array"}
            }
        };
        defineMetadata(typeKey, types, Type);
    }
}`;