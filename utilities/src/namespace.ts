import * as asyncHooks from "async_hooks";
import { defaultValue } from "./default-value";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

function createHooks(namespace) {
    function init(asyncId, type, triggerId, resource) {
        // Check if trigger has context
        // Or in other words, check if tigger is part of any request
        if (namespace.context[triggerId]) {
            // Here we keep passing the context from 
            // the triggerId to the new asyncId
            namespace.context[asyncId] = namespace.context[triggerId];
        }
    }

    function promiseResolve(asyncId) {
        destroy(asyncId);
    }

    function destroy(asyncId) {
        delete namespace.context[asyncId];
    }

    const asyncHook = asyncHooks.createHook({ init, destroy });

    asyncHook.enable();
}

export interface INamespace extends Function{
    create(name: string): Namespace;
    get(name: string): Namespace;
}

export class Namespace{
    private static namespaces: {} = {};
    static create(name: string): Namespace {
        if (Namespace.namespaces[name]) {
            throw new Error(`A namespace for ${name} is already exists`);
        }
        let namespace = new Namespace();
        Namespace.namespaces[name] = namespace;
        createHooks(namespace);
        return namespace;
    }
    static get(name: string): Namespace {
        return Namespace.namespaces[name];
    }
    private context: {};

    constructor() {
        this.context = {};
    }

    run(func: Function) : Promise<void>{
        let eid = asyncHooks.executionAsyncId();
        this.context[eid] = {};
        if(func instanceof AsyncFunction){
            return func();
        }
        else{
            return new Promise((resolve, reject) => {
                try{
                    func();
                    resolve();
                }
                catch(e){
                    reject(e);
                }
            });
        }
    }

    set(key, value) {
        const eid = asyncHooks.executionAsyncId();
        this.context[eid][key] = value;
    }

    get<T>(key): T {
        const eid = asyncHooks.executionAsyncId();
        if(this.context[eid]){
            return this.context[eid][key] as T;
        }
        else{
            return null;
        }
    }

    remove(key){
        const eid = asyncHooks.executionAsyncId();
        let value = this.get(key);
        let valueType : "string" | "number" | "object" | "array" | "boolean" = (typeof value === "string" ? "string" : 
        (typeof value === "number" ? "number" : 
        (typeof value === "object" ? "object" : 
        (typeof value === "boolean" ? "boolean" : null))));
        if(valueType === "object" && Array.isArray(value)){
            valueType = "array";
        }
        this.context[eid][key] = defaultValue(this.get(key), valueType);
    }

    dispose(){
        this.context = {};
    }
}