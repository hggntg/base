export const corets =
`import "reflect-metadata";
const typeKey = Symbol.for("Type");
const types: {
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
} = {
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
global["getClass"] = function (target: any): { new(...args: any[]): any } {
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
global["getMetadata"] = function<T>(key: string | Symbol, target: any) {
    return Reflect.getMetadata(key, getClass(target)) as T;
}
global["defineMetadata"] = function(key: string | Symbol, value: any, target: any) {
    return Reflect.defineMetadata(key, value, getClass(target));
}`