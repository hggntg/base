export class A implements IBaseClass{
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    input: string;
    constructor(_input: string){
        this.input = _input;
    }
    log(){
        console.log(this.input);
    }
}