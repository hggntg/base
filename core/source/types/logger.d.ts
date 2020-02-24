type TColor = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white";

interface IMessageStyle {
    bold?: boolean,
    underline?: boolean,
    fontColor?: TColor,
    backgroundColor?: TColor
}

interface IMessageSegment {
    tag: string;
    messages: Array<IMessage>;
    delimiter: string;
}

interface IMessage {
    text: string;
    style?: IMessageStyle;
}
interface ILog {
    level: "silly" | "debug" | "error" | "info" | "warn",
    message: IMessageSegment,
    htmlString?: string,
    metadata?: any
}

interface ILoggerProperty{
    appName: string;
}

interface ILogger extends IBaseClass<ILoggerProperty> {
    pushLog(log: ILog);
    pushLog(message: string, level: "silly" | "debug" | "error" | "info", tag: string, style?: IMessageStyle);
    pushWarn(message: string, tag: string);
    pushError(message: Error, tag: string);
    pushError(message: string, tag: string);
    pushSilly(message: string, tag: string);
    pushDebug(message: string, tag: string);
    pushInfo(message: string, tag: string);
    trace(isTrace: boolean);
    expand(): ILogger;
}


interface ILoggerUtils {
    reset: "\x1b[0m",
    bright: "x1b[1m",
    dim: "\x1b[2m",
    bold: "\u001b[1m",
    underline: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    fgblack: "\x1b[30m",
    fgred: "\x1b[31m",
    fggreen: "\x1b[32m",
    fgyellow: "\x1b[33m",
    fgblue: "\x1b[34m",
    fgmagenta: "\x1b[35m",
    fgcyan: "\x1b[36m",
    fgwhite: "\x1b[37m",
    bgblack: "\x1b[40m",
    bgred: "\x1b[41m",
    bggreen: "\x1b[42m",
    bgyellow: "\x1b[43m",
    bgblue: "\x1b[44m",
    bgmagenta: "\x1b[45m",
    bgcyan: "\x1b[46m",
    bgwhite: "\x1b[47m"
}

declare function generateLog(): string;
declare const LOGGER_SERVICE: "ILogger";
declare const LOGGER_UTILS: ILoggerUtils;
declare const logger: ILogger;
declare const FONT_COLOR_DEFAULT: ["red", "green", "yellow", "blue", "magenta", "cyan", "white"];
declare const FONT_COLOR_DEFAULT_LENGTH: number;