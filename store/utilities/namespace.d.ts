export interface INamespace extends Function {
    create(name: string): Namespace;
    get(name: string): Namespace;
}
export declare class Namespace {
    private static namespaces;
    static create(name: string): Namespace;
    static get(name: string): Namespace;
    private context;
    constructor();
    run(func: Function): Promise<void>;
    set(key: any, value: any): void;
    get<T>(key: any): T;
    remove(key: any): void;
    dispose(): void;
}
