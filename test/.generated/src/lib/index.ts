export class Lib implements IBaseClass {
    getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
    name: string;
    value: number;
    id: string;

    static getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
}
Type.declare({"kind":"class","name":"Lib","constructors":[],"extend":null,"implements":[],"methods":[],"properties":[]});