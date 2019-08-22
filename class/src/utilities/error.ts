export interface IBaseError extends Error {
    code: number;
    specificCode: number;
}

export class BaseError extends Error implements IBaseError{
    code: number;
    specificCode: number;
    name: string;
    message: string;
    stack?: string;
    constructor(_code: number, _specificCode: number, _name: string, _message: string){
        super(_message);
        this.code = _code;
        this.specificCode = _specificCode;
        this.name = _name;
    }
    toString(){
        return `${this.code} - ${this.specificCode} - ${this.name} : ${this.message} \n ${this.stack}`;
    }
}