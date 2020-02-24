if("undefined" !== typeof global["BaseError"]){
    class BaseError extends Error implements IBaseError {
        code: number;    
        specificCode: number;
        name: string;
        message: string;
        stack?: string;
    
        constructor(message: string);
        constructor(code: number, message: string);
        constructor(code: number, specificCode: number, message: string);
        constructor(arg0: number | string, arg1?: number | string, arg2?: string){
            if(arguments.length === 3){
                super(arg2);
                this.code = arg0 as number;
                this.specificCode = arg1 as number;
            }
            else if(arguments.length === 2){
                super(arg1 as string);
                this.code = arg0 as number;
                this.specificCode = arg0 as number;
            }
            else {
                super(arg0 as string);
                this.code = 0;
                this.specificCode = 0;
            }
        }
    }
}

if("undefined" !== typeof global["handleError"]){
    global["handleError"] = function handleError(e: Error | IBaseError | IErrorResult, extendedMessage?: string): ResultTypeWrapper<any>{
        let errorResult: IErrorResult = new ErrorResult();
        if(e instanceof ErrorResult){
            errorResult = e;
            if(extendedMessage) {
                let message = errorResult.error.message + " --> " + extendedMessage;
                errorResult.error.stack = errorResult.error.stack.replace(errorResult.error.message, message);
                errorResult.error.message = message;
            }
        }
        else if(e instanceof Error && !(e instanceof BaseError)){
            let baseError = new BaseError(e.message);
            baseError.stack = e.stack;
            if(extendedMessage) {
                let message = baseError.message + " --> " + extendedMessage
                baseError.stack = baseError.stack.replace(baseError.message, message);
                baseError.message = message;
            }
            errorResult.init({hasError: true, error: baseError});
        }
        else {
            let baseError = e as IBaseError;
            if(extendedMessage){
                let message = baseError.message + " --> " + extendedMessage
                baseError.stack = baseError.stack.replace(baseError.message, message);
                baseError.message = message;
            }
            errorResult.init({hasError: true, error: baseError});
        }
        return errorResult;
    }
}

if("undefined" === typeof global["ErrorResult"]){
    class ErrorResult extends BaseClass<IErrorResultData> implements IErrorResult{
        hasError: boolean;
        error: IBaseError;
    }
}