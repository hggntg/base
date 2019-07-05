export interface IMessageStyle {
    bold?: boolean,
    underline?: boolean,
    fontColor?: string | { r: number, g: number, b: number },
    backgroundColor?: string | { r: number, g: number, b: number }
}

export interface IMessageSegment {
    tag: string;
    messages: Array<IMessage>;
    delimiter: string;
}

export interface IMessage {
    text: string;
    style?: IMessageStyle;
}
export interface ILog {
    level: "silly" | "debug" | "error" | "info",
    message: IMessageSegment,
    htmlString?: string,
    metadata?: any
}

export interface ILoggerProperty{
    appName: string;
}

export interface ILogger extends IBaseClass<ILoggerProperty> {
    pushLog(log: ILog);
    pushLog(message: string, level: "silly" | "debug" | "error" | "info", tag: string, style?: IMessageStyle);
    pushError(message: Error, tag: string);
    pushError(message: string, tag: string);
    pushSilly(message: string, tag: string);
    pushDebug(message: string, tag: string);
    pushInfo(message: string, tag: string);
    trace(isTrace: boolean);
    expand(): ILogger;
}