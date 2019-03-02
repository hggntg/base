import { IBaseEntity } from "@base/interfaces";
export declare function DCollection<T extends IBaseEntity>(classImp: {
    new (): T;
}): (target: object, propertyKey: string) => void;
