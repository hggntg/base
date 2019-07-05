export class A implements IBaseClass{
    getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
    input: string;
    constructor(_input: string){
        this.input = _input;
    }
    log(){
        console.log(this.input);
    }

    static getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
}
Type.declare({"kind":"class","name":"A","constructors":[{"kind":"construct","name":"A.constructor.0","params":[]}],"extend":null,"implements":[],"methods":[],"properties":[]});