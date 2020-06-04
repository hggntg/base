if("undefined" === typeof global["ErrorLevel"]){
    class ErrorLevel implements IErrorLevel {
        level: TErrorLevel;
        static RED: IErrorLevel;
        static GREEN: IErrorLevel;
        static isInstance(input: any): boolean {
            if(input && input.level === "red" || input.level === "green"){
                return true;
            }
            return false;
        }
        static asInstance(input: any){
            return input;
        }
        static has(input, key: string): boolean {
            if(input && input[key]){
                return true;
            }
            return false;
        }
    }
    const redLevel = new ErrorLevel();
    redLevel.level = "red";
    const greenLevel = new ErrorLevel();
    greenLevel.level = "green";
    global["ErrorLevel"] = ErrorLevel;
    global["ErrorLevel"].RED = redLevel;
    global["ErrorLevel"].GREEN = greenLevel;
}
if ("undefined" === typeof global["BaseError"]) {
    class BaseError extends Error implements IBaseError {
        code: number;
        specificCode: number;
        name: string;
        message: string;
        stack?: string;
        level: TErrorLevel;
        logged: boolean;

        static isInstance(input: any): boolean{
            let isValid = 1;
            if(input && input instanceof Error){
                let keys = ["code", "specificCode", "name", "message", "level", "stack", "logged"];
                keys.map(key => {
                    isValid *= this.has(input, key) ? 1 : 0;
                });
                if(isValid) return true;
            }
            return false;
        }

        static has(input: any, key: string): boolean {
            if(input && typeof input[key] !== "undefined" && input[key] !== null){
                return true;
            }
            return false;
        }

        static asInstance(input: any){
            return input;
        }

        constructor(message: string);

        constructor(message: string, level: "red" | "green");
        constructor(code: number, message: string);

        constructor(code: number, specificCode: number, message: string);
        constructor(code: number, message: string, level: IErrorLevel);

        constructor(code: number, specificCode: number, message: string, level: "red" | "green");
        constructor(arg0: number | string, arg1?: number | string | IErrorLevel, arg2?: string | IErrorLevel, arg3?: string | IErrorLevel) {
            if (arguments.length === 4) {
                super(arg2 as string);
                this.code = arg0 as number;
                this.specificCode = arg1 as number;
                this.level = ErrorLevel.asInstance(arg3).level;
            }
            else if (arguments.length === 3) {
                if (ErrorLevel.isInstance(arg2)) {
                    super(arg1 as string);
                    this.code = arg0 as number;
                    this.specificCode = arg1 as number;
                    this.level = ErrorLevel.asInstance(arg2).level;
                }
                else {
                    super(arg2 as string);
                    this.code = arg0 as number;
                    this.specificCode = arg1 as number;
                    this.level = "green";
                }
            }
            else if (arguments.length === 2) {
                if (ErrorLevel.isInstance(arg1)) {
                    super(arg1 as string);
                    this.code = 0;
                    this.specificCode = 0;
                    this.level = ErrorLevel.asInstance(arg1).level;
                }
                else {
                    super(arg1 as string);
                    this.code = arg0 as number;
                    this.specificCode = arg0 as number;
                    this.level = "green";
                }
            }
            else {
                super(arg0 as string);
                this.code = 500;
                this.specificCode = 500;
                this.level = "green";
            }
            this.logged = false;
        }
    }
    global["BaseError"] = BaseError;
}

if ("undefined" === typeof global["handleError"]) {
    global["handleError"] = function handleError(e: Error | IBaseError, messageOrErrorLevel: (string | IErrorLevel)): IBaseError {
        let baseError: IBaseError;

        if (e instanceof Error && !BaseError.isInstance(e)) {
            if (messageOrErrorLevel){
                if(ErrorLevel.isInstance(messageOrErrorLevel)) {
                    baseError = new BaseError(e.message, ErrorLevel.asInstance(messageOrErrorLevel));
                    baseError.stack = e.stack;
                }
                else {
                    baseError = new BaseError(e.message);
                    baseError.stack = e.stack;
                    let message = baseError.message + " --> " + messageOrErrorLevel as string;
                    baseError.stack = baseError.stack.replace(baseError.message, message);
                    baseError.message = message;
                }
            }
            else {
                baseError = new BaseError(e.message);
                baseError.stack = e.stack;
            }
        }
        else {
            baseError = e as IBaseError;
            if (messageOrErrorLevel) {
                if(ErrorLevel.isInstance(messageOrErrorLevel)) {
                    if (baseError.level === "green") baseError.level = ErrorLevel.asInstance(messageOrErrorLevel).level;
                }
                else {
                    let message = baseError.message + " --> " + messageOrErrorLevel as string;
                    baseError.stack = baseError.stack.replace(baseError.message, message);
                    baseError.message = message;
                }
            }            
        }
        process.emit("app-error", baseError);
        return baseError;
    }
}

if("undefined" === typeof global["ResultTypeWrapper"]){
    class ResultTypeWrapper<T> implements IResultTypeWrapper<T> {
        value: T;        
        error: IBaseError;
        static wrap<T>(_error: (Error | IBaseError)): IResultTypeWrapper<T>;
        static wrap<T>(_value: T): IResultTypeWrapper<T>;
        static wrap<T>(input: (Error | IBaseError) | T): IResultTypeWrapper<T>{
            let result = new ResultTypeWrapper<T>();
            if(input instanceof Error || BaseError.isInstance(input)){
                result.error = handleError(input as (Error | IBaseError));
            }
            else {
                result.value = input as T;
            }
            return result;
        }
    }
    global["ResultTypeWrapper"] = ResultTypeWrapper;
}