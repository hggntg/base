import * as asyncHooks from "async_hooks";
import { defaultValue } from "./default-value";
import { INamespace, IContext } from "@base-interfaces/utilities";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

function createHooks(namespace: INamespace) {
    function init(asyncId, type, triggerId, resource) {
        // Check if trigger has context
        // Or in other words, check if tigger is part of any request
        let parent = namespace.getById(triggerId);
        if (parent) {
            // Here we keep passing the context from 
            // the triggerId to the new asyncId
            let current = namespace.getById(asyncId);
            if(!current){
                current = {
                    value   : {},
                    manual  : false,
                    prev    : null
                }
                namespace.setById(asyncId, current);
            }
            current.value = parent ? parent.value : null;
            current.manual = false;
            current.prev = triggerId;

            if(!parent.children){
                parent.children = [];
            }
            parent.children.push(asyncId);
            namespace.setById(triggerId, parent);
        }
    }

    function promiseResolve(asyncId) {
        destroy(asyncId);
    }

    function destroy(asyncId) {
        namespace.flush(asyncId);
    }

    const asyncHook = asyncHooks.createHook({ init, destroy, promiseResolve });

    asyncHook.enable();
}

export class Namespace implements INamespace{
    private static namespaces: {} = {};
    static create(name: string): INamespace {
        if (Namespace.namespaces[name]) {
            throw new Error(`A namespace for ${name} is already exists`);
        }
        let namespace = new Namespace();
        Namespace.namespaces[name] = namespace;
        createHooks(namespace);
        return namespace;
    }
    
    static get(name: string): INamespace {
        return Namespace.namespaces[name];
    }

    static destroy(name: string){
        delete Namespace.namespaces[name];
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

    getById(id: number): IContext {
        return this.context[id];
    }
    setById(id: number, value: IContext): void {
        this.context[id] = value;
    }

    set(key, value) {
        const eid = asyncHooks.executionAsyncId();
        if(!this.context[eid]){
            this.context[eid] = {
                value   : {},
                manual  : true,
                prev    : asyncHooks.triggerAsyncId()
            };
        }
        this.context[eid]["value"][key] = value;
    }

    get<T>(key): T {
        const eid = asyncHooks.executionAsyncId();
        if(this.context[eid] && this.context[eid]["value"]){
            return this.context[eid]["value"][key] as T;
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
        this.context[eid]["value"][key] = defaultValue(this.get(key), valueType);
    }

    flush(id){
        let current = this.context[id];
        if(current){
            let parent = current.prev !== null ? this.context[current.prev] : null;
            if(current.children){
                let children = current.children;
                let childrenLength = children.length;
                for(let i = 0; i < childrenLength; i++){
                    delete this.context[children[i]];
                }
                delete this.context[id];
            }
            if(parent && parent.children){
                let children = parent.children;
                let childrenLength = children.length;
                for(let i = 0; i < childrenLength; i++){
                    let child = this.context[children[i]];
                    if(!child.manual){
                        delete this.context[children[i]];
                        children.splice(i, 1);
                        i--;
                    }
                }
                parent.children = children;
                if(parent.children.length === 0){
                    delete this.context[current.prev];
                }
                else{
                    this.context[current.prev] = parent;
                }
            }
        }
    }

    dispose(){
        this.context = {};
    }
}