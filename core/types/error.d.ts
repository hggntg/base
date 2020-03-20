type TErrorLevel = "red" | "green";

interface IErrorLevel {
    level: TErrorLevel;
}

interface ErrorLevelConstructor extends IBaseConstructor<IErrorLevel>{
    RED: IErrorLevel;
    GREEN: IErrorLevel;
}

declare var ErrorLevel: ErrorLevelConstructor;

interface IBaseError extends Error, IErrorLevel {
    code: number;
    specificCode: number;
    logged: boolean;
}
interface IResultTypeWrapper<T>{
    value: T;
    error: IBaseError;
}
declare class ResultTypeWrapper<T>  implements IResultTypeWrapper<T> {
    value: T;    
    error: IBaseError;
    static wrap<T>(_error: Error | IBaseError): IResultTypeWrapper<T>;
    static wrap<T>(_value: T): IResultTypeWrapper<T>;
    static wrap<T>(input: (Error | IBaseError) | T): IResultTypeWrapper<T>;

}

interface BaseErrorConstructor extends IBaseConstructor<IBaseError> {
    new(message: string): IBaseError;
        
    new(message: string, level: TErrorLevel): IBaseError;
    new(code: number, message: string): IBaseError;

    new(code: number, specificCode: number, message: string): IBaseError;
    new(code: number, message: string, level: TErrorLevel): IBaseError;
    
    new(code: number, specificCode: number, message: string, level: IErrorLevel): IBaseError;
    new(arg0: number | string, arg1?: number | string | IErrorLevel, arg2?: string | IErrorLevel, arg3?: IErrorLevel): IBaseError;
}
    
declare var BaseError: BaseErrorConstructor;

declare function handleError(e: Error | IBaseError, extendedMessage?: string): IBaseError;
declare function handleError(e: Error | IBaseError, errorLevel?: IErrorLevel): IBaseError;
declare function handleError(e: Error | IBaseError, extendedMessage?: string | IErrorLevel): IBaseError;