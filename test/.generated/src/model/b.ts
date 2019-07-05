export class B implements IBaseClass{
    getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
    input: string;
    constructor(_input: string){
        this.input = _input;
    }

    static getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
}
Type.declare({"kind":"class","name":"B","constructors":[{"kind":"construct","name":"B.constructor.0","params":[]}],"extend":null,"implements":[],"methods":[],"properties":[]});