/// <reference types="node" />
/// <reference path="./types/index.d.ts" />

declare namespace NodeJS {
    interface Process {
        emit(event: "app-error", error: IBaseError): boolean;
        on(event: "app-error", listener: NodeJS.AppErrorListener): Process;
    }
    type AppErrorListener = (error: IBaseError) => void;
}