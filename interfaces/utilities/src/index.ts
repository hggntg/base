export interface INamespace{
    run(func: Function) : Promise<void>;
    set(key, value): void;
    getById(id: number): IContext;
    setById(id: number, value: IContext): void;
    get<T>(key): T;
    flush(id: number): void;
    remove(key): void;
    dispose(): void;
}
export interface INamespaceStatic {
    create(name: string): INamespace;
    get(name: string): INamespace;
    new(): INamespace;
}
export interface IContext{
    value?: any;
    prev?: number;
    children?: Array<number>,
    manual?: boolean
}