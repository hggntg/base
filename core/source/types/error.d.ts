interface IBaseError extends Error {
    code: number;
    specificCode: number;
}

interface IErrorResultData {
    hasError: boolean;
    error: IBaseError;
}
declare type ResultTypeWrapper<T> = IErrorResult | T;
interface IErrorResult extends IBaseClass<IErrorResultData>, IErrorResultData {}

declare class BaseError extends Error implements IBaseError {
    code: number;    
    specificCode: number;
    name: string;
    message: string;
    stack?: string;

    constructor(message: string);
    constructor(code: number, message: string);
    constructor(code: number, specificCode: number, message: string);
    constructor(arg0: number | string, arg1?: number | string, arg2?: string);
}

declare function handleError(e: Error | IBaseError | IErrorResult, extendedMessage?: string): ResultTypeWrapper<any>;
declare class ErrorResult extends BaseClass<IErrorResultData> implements IErrorResult{
    hasError: boolean;
    error: IBaseError;
}