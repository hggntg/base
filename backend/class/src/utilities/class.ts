import "reflect-metadata";
export function getClass(target: any): {new() : any}{
    if(target){
        if(typeof target === "object" && typeof target.constructor === "function"){
            return target.constructor;
        }
        else{
            return target;
        }
    }
    else{
        throw new Error("Error target is undefined cannot identify a class");
    }
}

export function getMetadata(key: string | Symbol, classImp: Function){
    return Reflect.getMetadata(key, classImp);
}

export function defineMetadata(key: string | Symbol, value: any, classImp: Function){
    return Reflect.defineMetadata(key, value, classImp);
}