interface IChainError{
    errors: Error[]
}

export class ChainError implements IChainError{
    errors: Error[];
    constructor(err: Error);
    constructor(chainErr: IChainError);
    constructor(errOrChainErr: Error | IChainError | string){
        if(!this.errors){
            this.errors = [];
        }       
        if(errOrChainErr instanceof Error){
            this.errors.push(errOrChainErr);
            errOrChainErr = null;
        }
        else if (typeof errOrChainErr === "string"){
            this.errors.push(new Error(errOrChainErr))
        }
        else if (errOrChainErr){
            this.errors = this.errors.concat(errOrChainErr.errors.slice(0));
            errOrChainErr = null;
        }
    }
}