export interface IExtendLogger {
    logger: ILogger;
    setLog(hasLog: boolean, appName: string);
}