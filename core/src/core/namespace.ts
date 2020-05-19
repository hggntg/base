import * as asyncHooks from "async_hooks";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

if ("undefined" === typeof global["Context"]){
    class Context implements IContext{
        clone(): IContextProperty {
            throw new Error("Method not implemented.");
        }
        toJSON(): string {
            throw new Error("Method not implemented.");
        }
        fromJSON(input: string): IContextProperty {
            throw new Error("Method not implemented.");
        }
        init(input: Partial<IContextProperty>): void {
            throw new Error("Method not implemented.");
        }
        getType(): IClassType {
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
    global["Context"] = Context;
}

if ("undefined" === typeof global["createHooks"]){
    global["createHooks"] = function createHooks(namespace: INamespace) {
        function init(asyncId, type, triggerId, resource) {
            let parent = namespace.getById(triggerId);
            if (parent) {
                let current = namespace.getById(asyncId);
                if (!current) {
                    current = new Context({
                        value: {},
                        type: type,
                        resource: resource,
                        manual: false,
                        prev: null
                    });
                }
                current.value = parent.value || {};
                current.manual = false;
                current.prev = triggerId;
                current.held = parent.held || false;
                current.resourceId = parent.resourceId || undefined;
                let hasParentResource = true;
                if(!current.resourceId && current.resourceId !== 0) {
                    current.resourceId = namespace.currentValueIndex++;   
                    parent.resourceId = current.resourceId;   
                    hasParentResource = false;
                }
                if(!namespace.valueContexts[current.resourceId]) {
                    namespace.valueContexts[current.resourceId] = {
                        sharedHolders: [asyncId],
                        value: {}
                    }
                }
                else {
                    namespace.valueContexts[current.resourceId].sharedHolders.push(asyncId);
                }
                if(!hasParentResource && parent){
                    namespace.valueContexts[current.resourceId].sharedHolders.push(triggerId);
                }
                namespace.setById(asyncId, current);
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(asyncId);
                namespace.setById(triggerId, parent);
            }
        }

        function destroy(asyncId) {
            namespace.flush(asyncId, true);
        }

        function after(asyncId) {
            namespace.flush(asyncId);
        }

        function promiseResolve(asyncId) {
            namespace.flush(asyncId);
        }

        const asyncHook = asyncHooks.createHook({ init, destroy, after, promiseResolve });
    
        asyncHook.enable();
    }
}

if("undefined" === typeof global["Namespace"]){
    class Namespace implements INamespace{
        private static namespaces: {} = {};
        static create(name: string): INamespace {
            if (Namespace.namespaces[name]) {
                throw new Error(`A namespace for \${name} is already exists`);
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
            setInterval(() => {
                this.clearValueContext();
            }, 5000);
        }
        currentValueIndex: number = 0;
        valueContexts: { 
            [key: string]: { 
                value: any; 
                sharedHolders: number[];
            };
        } = {};
        private clearValueContext(){
            let keys = Object.keys(this.valueContexts);
            let start = Number(keys[0]);
            for(let i = start; i <= this.currentValueIndex; i++){
                let valueContext = this.valueContexts[i.toString()];
                if(valueContext){
                    let valueKeys = Object.keys(valueContext.value || {});
                    if(valueKeys.length === 0){
                        valueContext.sharedHolders.map(sharedHolder => {
                            this.flush(sharedHolder, true);
                        });
                    }
                }
            }
        }
        cloneById(sourceId: number) {
            let source = this.getById(sourceId);
            let destValue = Object.__base__clone(source.value);
            let dest = new Context({
                children: [],
                flushed: false,
                held: false,
                manual: true,
                prev: null,
                value: destValue,
                type: source.type,
                resource: source.resource ? Object.__base__clone(source.resource) : undefined,
                resourceId: source.resourceId
            });
            this.setById(asyncHooks.triggerAsyncId(), dest);
        }

        holdById(id: number) {
            let current = this.getById(id);
            if (current) {
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
    
        run(func: Function): Promise<void> {
            let asyncId = asyncHooks.executionAsyncId();
            let triggerId = asyncHooks.triggerAsyncId();
            let parent = this.getById(triggerId);
            while(!parent && triggerId > 0){
                triggerId--;
                parent = this.getById(triggerId);
            }
            if (parent) {
                // Here we keep passing the context from 
                // the triggerId to the new asyncId
                let current = this.getById(asyncId);
                if (!current) {
                    current = new Context({
                        value: {},
                        manual: false,
                        prev: null
                    });
                }
                current.value = parent.value || {};
                current.manual = true;
                current.prev = triggerId;
                current.held = parent.held || false;
                current.resourceId = parent.resourceId;
                if (current.resourceId || current.resourceId === 0) this.valueContexts[current.resourceId].sharedHolders.push(asyncId);
                else {
                    current.resourceId = this.currentValueIndex++;
                    parent.resourceId = current.resourceId;
                    this.valueContexts[current.resourceId] = {
                        sharedHolders: [triggerId, asyncId],
                        value: {}
                    }
                }
                this.setById(asyncId, current);
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(asyncId);
                this.setById(triggerId, parent);
            }
            else {
                let current = this.getById(asyncId);
                if (!current) {
                    current = new Context({
                        value: {},
                        manual: false,
                        prev: null
                    });
                }
                current.value = {};
                current.manual = true;
                if (!current.resourceId && current.resourceId !== 0) {
                    current.resourceId = this.currentValueIndex;
                    this.valueContexts[this.currentValueIndex++] = {
                        value: {},
                        sharedHolders: [asyncId]
                    };
                }
                this.setById(asyncId, current);
            }
            if (func instanceof AsyncFunction) {
                return func();
            }
            else {
                return new Promise((resolve, reject) => {
                    try {
                        func();
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            }
        }

        getById(id: number): IContext {
            return this.context[id];
        }
        setById(id: number, value: IContext): void {
            if(!value.resourceId && value.resourceId !== 0){
                value.resourceId = this.currentValueIndex++;
            }
            if(this.valueContexts[value.resourceId]){
                this.valueContexts[value.resourceId].value = value.value;
            }
            else {
                this.valueContexts[value.resourceId] = {
                    sharedHolders: [id],
                    value: value.value
                }
            }
            this.context[id] = value;

        }
        removeById(id: number, key = undefined) {
            let current = this.context[id];
            if(current){
                if(current.value){
                    delete current.value[key];
                }
                if(current.resourceId || current.resourceId === 0) {
                    if(this.valueContexts[current.resourceId]){
                        delete this.valueContexts[current.resourceId].value[key];
                    }
                }
            }
        }
    
        set(key, value) {
            const eid = asyncHooks.executionAsyncId();
            if (!this.context[eid]) {
                this.context[eid] = new Context({
                    value: {},
                    manual: true,
                    prev: asyncHooks.triggerAsyncId()
                });
            }
            let current = this.context[eid];
            current.manual = true;
            if (!current.resourceId && current.resourceId !== 0) {
                let parent = this.context[current.prev];
                current.resourceId = parent ? parent.resourceId : undefined;
                if (!current.resourceId && current.resourceId !== 0) {
                    current.resourceId = this.currentValueIndex++;
                }
            }
            if (this.valueContexts[current.resourceId]) {
                if (!this.valueContexts[current.resourceId].sharedHolders.includes(eid)) this.valueContexts[current.resourceId].sharedHolders.push(eid);
                this.valueContexts[current.resourceId].value[key] = value;
            }
            else {
                this.valueContexts[current.resourceId] = {
                    sharedHolders: [eid],
                    value: {}
                }
                this.valueContexts[current.resourceId].value[key] = value;
            }

            this.context[eid]["value"] = this.valueContexts[current.resourceId].value;
        }

        setValueById(id: number, key, value){
            let current = this.getById(id);
            if(!current.resourceId && current.resourceId !== 0){
                current.resourceId = this.currentValueIndex++;
            }
            if(!this.valueContexts[current.resourceId]){
                this.valueContexts[current.resourceId] = {
                    sharedHolders: [id],
                    value: {}
                }
            }
            this.valueContexts[current.resourceId].value[key] = value;
            current.value[key] = value;
            this.context[id] = current;
        }

        get<T>(key): T {
            const eid = asyncHooks.executionAsyncId();
            let current = this.getById(eid);
            if(current){
                if(current.value){
                    return current.value[key] as T;
                }
            }
            return null;
        }

        getValueById<T>(id: number, key): T {
            const current = this.getById(id);
            if(current) {
                if(current.value){
                    return current.value[key] as T;
                }
            }
            return null;
        }
    
        remove(key) {
            const eid = asyncHooks.executionAsyncId();
            let current = this.getById(eid);
            if(current){
                if(current.value){
                    delete current.value[key];
                }
                if(current.resourceId || current.resourceId === 0){
                    if(this.valueContexts[current.resourceId]){
                        delete this.valueContexts[current.resourceId].value[key];
                    }
                }
            }
            this.setById(eid, current);
        }
    
        flush(id, force = false) {
            let current = this.getById(id);
            if(current && force){
                if(current.resourceId || current.resourceId === 0) {
                    if(this.valueContexts[current.resourceId]){
                        this.valueContexts[current.resourceId].sharedHolders.map((sharedHolder, i, arr) => {
                            if(sharedHolder === id){
                                arr.splice(i, 1);
                            }
                        });
                        if(this.valueContexts[current.resourceId].sharedHolders.length === 0){
                            delete this.valueContexts[current.resourceId];
                        }
                    }
                }
                (current.children || []).map(childId => {
                    this.flush(childId, force);
                });
                delete this.context[id];
            }
        }
    
        dispose(){
            this.context = {};
        }
    }
    global["Namespace"] = Namespace;
}