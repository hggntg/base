import * as asyncHooks from "async_hooks";
import { defaultValue } from "./default-value";
import { INamespace, IContext, IContextValue, IContextOriginValue, IContextProperty } from "../interface";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

class Context implements IContext{
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    initValue(input: Partial<IContextProperty>): void {
        throw new Error("Method not implemented.");
    }
    held?: boolean;
    flushed?: boolean;
    private _type?: any;
    private _resource?: any;
    value?: any;
    children?: Array<number>;
    manual?: boolean;
    prev?: number;
    set type(value: any){
        this._type = value;
    }
    set resource(value: any){
        this._resource = value;
    }
    
    originValue(){
        return {
            value: this.value,
            prev: this.prev,
            manual: this.manual,
            children: this.children
        }
    }

    rawValue(){
        return{
            resource: this._resource,
            type: this._type,
            value: this.value,
            prev: this.prev,
            manual: this.manual,
            children: this.children
        }
    }

    constructor();
    constructor(input: IContextValue);
    constructor(input?: IContextValue){
        if(input){
            this._type = input.type;
            this._resource = input.resource;
            this.value = input.value;
            this.children = input.children;
            this.manual = input.manual;
            this.prev = input.prev;
        }
    }
}

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
                current = new Context({
                    value   : {},
                    type    : type,
                    resource: resource,
                    manual  : false,
                    prev    : null
                });
            }
            current.value = parent ? parent.value : {};
            current.manual = false;
            current.prev = triggerId;
            current.held = parent ? parent.held : false;
            namespace.setById(asyncId, current);
            if(!parent.children){
                parent.children = [];
            }
            parent.children.push(asyncId);
            namespace.setById(triggerId, parent);
        }
    }

    function destroy(asyncId) {
        namespace.flush(asyncId);
    }

    const asyncHook = asyncHooks.createHook({ init, destroy });

    asyncHook.enable();
}

export class Namespace implements INamespace{
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    initValue(input: Partial<any>): void {
        throw new Error("Method not implemented.");
    }
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

    private context: {
        [key in string]: IContext
    };

    constructor() {
        this.context = {};
    }

    cloneById(sourceId: number){
        let source = this.getById(sourceId);
        let destValue = Object.assign({}, source.value);
        let dest = new Context({
            children: [],
            flushed: false,
            held: false,
            manual: true,
            prev: null,
            value: destValue,
            type: source.type,
            resource: source.resource ? Object.assign({}, source.resource) : undefined
        });
        this.setById(asyncHooks.triggerAsyncId(), dest);
    }

    holdById(id: number){
        let current = this.getById(id);
        if(current){
            current.held = true;
            this.setById(id, current);
        }
    }

    getCurrentId(){
        return asyncHooks.executionAsyncId();
    }

    getParentId(){
        return asyncHooks.triggerAsyncId();
    }

    originValue(){
        let origins: {
            [key in string]: IContextOriginValue
        } = {};
        let valueKeys = Object.keys(this.context);
        Object.values(this.context).map((value, index) => {
            if(typeof value.originValue === "function"){
                origins[valueKeys[index]] = value.originValue();
            }
            else{
                origins[valueKeys[index]] = value;
            }
        })
        return origins;
    }

    rawValue(){
        let raws: {
            [key in string]: IContextValue
        } = {};
        let valueKeys = Object.keys(this.context);
        Object.values(this.context).map((value, index) => {
            if(typeof value.rawValue === "function"){
                raws[valueKeys[index]] = value.rawValue();
            }
            else{
                raws[valueKeys[index]] = value;
            }
        })
        return raws;
    }

    run(func: Function) : Promise<void>{
        let asyncId = asyncHooks.executionAsyncId();
        let triggerId = asyncHooks.triggerAsyncId();
        let parent = this.getById(triggerId);
        if (parent) {
            // Here we keep passing the context from 
            // the triggerId to the new asyncId
            let current = this.getById(asyncId);
            if(!current){
                current = new Context({
                    value   : {},
                    manual  : false,
                    prev    : null
                });
            }
            current.value = parent ? parent.value : {};
            current.manual = true;
            current.prev = triggerId;
            current.held = parent ? parent.held : false;
            this.setById(asyncId, current);
            if(!parent.children){
                parent.children = [];
            }
            parent.children.push(asyncId);
            this.setById(triggerId, parent);
        }
        else{
            let current = this.getById(asyncId);
            if(!current){
                current = new Context({
                    value   : {},
                    manual  : false,
                    prev    : null
                });
            }
            current.value = {};
            current.manual = true;
            this.setById(asyncId, current);
        }
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
            this.context[eid] = new Context({
                value   : {},
                manual  : true,
                prev    : asyncHooks.triggerAsyncId()
            });
        }
        this.context[eid].manual = true;
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
        delete this.context[eid]["value"][key];
    }

    flush(id, force = false){
        let current = this.context[id];
        if(current){
            if(!current.held || (current.held && current.flushed && force) || force){
                let parent = current.prev !== null ? this.context[current.prev] : null;
                let currentIsFlushed = false;
                if(current.children){
                    let children = current.children;
                    let childrenLength = children.length;
                    for(let i = 0; i < childrenLength; i++){
                        let currentChild = this.context[children[i]];
                        if(!currentChild){
                            children.splice(i, 1);
                            i--;
                            childrenLength--;
                        }
                        else if(!currentChild.held || (currentChild.held && force)){
                            delete this.context[children[i]];
                            children.splice(i, 1);
                            i--;
                            childrenLength--;
                        }
                    }
                    if(children.length === 0){
                        delete this.context[id];
                        currentIsFlushed = true;
                    }
                    else{
                        current.children = children;
                        current.flushed = true;
                        this.context[id] = current;
                    }
                }
                if(currentIsFlushed){
                    if(parent && parent.children){
                        let children = parent.children;
                        let childrenLength = children.length;
                        for(let i = 0; i < childrenLength; i++){
                            let child = this.context[children[i]];
                            if(child && !child.manual){
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
            else{
                current.flushed = true;
                this.context[id] = current;
            }
        }
    }

    dispose(){
        this.context = {};
    }
}