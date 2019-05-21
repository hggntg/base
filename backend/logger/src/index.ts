import { EventEmitter } from "events";
import { ILogger, ILog, IMessageStyle } from "@base-interfaces/logger";
import chalk from "chalk";

const FONT_COLOR_DEFAULT = [
    { r: 233, g: 30, b: 99 },
    { r: 213, g: 0, b: 249 },
    { r: 255, g: 82, b: 82 },
    { r: 33, g: 150, b: 243 },
    { r: 230, g: 81, b: 0 },
    { r: 255, g: 61, b: 0 },
    { r: 255, g: 255, b: 0 }
];
const FONT_COLOR_DEFAULT_LENGTH = FONT_COLOR_DEFAULT.length;

export class Logger implements ILogger {
    static maxLength: number = 0;
    private tracing: boolean;
    private eventInstance: EventEmitter;
    private appName: string;
    private displayAppName: string;
    private on(event: "data", listener: (data: string) => void): ILogger {
        this.eventInstance.on(event, listener);
        return this;
    }
    expand(): ILogger {
        return new Logger(this.appName);
    }
    pushLog(log: ILog);
    pushLog(message: string, level: "silly" | "debug" | "error" | "info", tag: string, style?: IMessageStyle);
    pushLog(arg0: (string | ILog), arg1?: "silly" | "debug" | "error" | "info", arg2?: string, arg3?: IMessageStyle) {
        if(this.tracing){
            if (typeof arg0 === "string") {
                let ctx = new chalk.constructor();
                let message = arg0 as string;
                let level = arg1 as "silly" | "debug" | "error" | "info";
                let tag = arg2 as string;
                let style = arg3 as IMessageStyle;
                if (style) {
                    if (style.bold) {
                        ctx = ctx.bold;
                    }
                    if (style.underline) {
                        ctx = ctx.underline;
                    }
                    if (style.fontColor) {
                        if (typeof style.fontColor === "string") {
                            ctx = ctx.hex(style.fontColor);
                        }
                        else {
                            ctx = ctx.rgb(style.fontColor.r, style.fontColor.g, style.fontColor.b);
                        }
                    }
                    if (style.backgroundColor) {
                        if (typeof style.backgroundColor === "string") {
                            ctx = ctx.hex(style.backgroundColor);
                        }
                        else {
                            ctx = ctx.rgb(style.backgroundColor.r, style.backgroundColor.g, style.backgroundColor.b);
                        }
                    }
                }
                let date = new Date();
                let dateString = chalk.rgb(255, 255, 255)(date.toISOString() + "(" + date.toLocaleString() + ")");
                let prefix = chalk.rgb(250, 250, 250)("SILLY");
                if (level === "debug") {
                    prefix = chalk.rgb(13, 71, 161)("DEBUG");
                }
                else if (level === "info") {
                    prefix = chalk.rgb(0, 230, 118)(" INFO");
                }
                else if (level === "error") {
                    prefix = chalk.rgb(244, 67, 54)("ERROR");
                }
                if (typeof ctx === "function") {
                    message = ctx(message);
                }
                let resultString = `${this.displayAppName} - ${dateString} - ${prefix}${tag ? " - [" + tag + "]" : ""} - ${message}`;
                this.eventInstance.emit("data", resultString);
            }
            else {
                let log = arg0 as ILog;
                let messageText = [];
                let tag = chalk.bgRgb(255, 255, 0).rgb(183, 28, 28)(log.message.tag);
                log.message.messages.map(message => {
                    let ctx = new chalk.constructor();
                    if (message.style) {
                        if (message.style.fontColor) {
                            if (typeof message.style.fontColor === "string") {
                                ctx = ctx.hex(message.style.fontColor);
                            }
                            else {
                                ctx = ctx.rgb(message.style.fontColor.r, message.style.fontColor.g, message.style.fontColor.b);
                            }
                        }
                        if (message.style.backgroundColor) {
                            if (typeof message.style.backgroundColor === "string") {
                                ctx = ctx.bgHex(message.style.backgroundColor);
                            }
                            else {
                                ctx = ctx.bgRgb(message.style.backgroundColor.r, message.style.backgroundColor.g, message.style.backgroundColor.b);
                            }
                        }
                        if (message.style.bold) {
                            ctx = ctx.bold;
                        }
                        if (message.style.underline) {
                            ctx = ctx.underline;
                        }
                    }
                    if (typeof ctx !== "function") {
                        messageText.push(message.text);
                    }
                    else {
                        messageText.push(ctx(message.text));
                    }
                });
                let date = new Date();
                let dateString = chalk.rgb(255, 255, 255)(date.toISOString() + "(" + date.toLocaleString() + ")");
                let prefix = chalk.rgb(250, 250, 250)("SILLY");
                if (log.level === "debug") {
                    prefix = chalk.rgb(13, 71, 161)("DEBUG");
                }
                else if (log.level === "info") {
                    prefix = chalk.rgb(0, 230, 118)(" INFO");
                }
                else if (log.level === "error") {
                    prefix = chalk.rgb(244, 67, 54)("ERROR");
                }
                let resultString = `${this.displayAppName} - ${dateString} - ${prefix}${tag ? " - [" + tag +"]" : ""} - ${messageText.join(log.message.delimiter)}`;
                this.eventInstance.emit("data", resultString);
            }
        }
    }
    pushError(message: string, tag: string) {
        if(this.tracing) this.pushLog(message, "error", tag, { fontColor: "#f44336" });
    }
    pushSilly(message: string, tag: string) {
        if(this.tracing) this.pushLog(message, "silly", tag, { fontColor: "#e0e0e0" });
    }
    pushDebug(message: string, tag: string) {
        if(this.tracing) this.pushLog(message, "debug", tag, { fontColor: "#2196f3" });
    }
    pushInfo(message: string, tag: string){
        if(this.tracing) this.pushLog(message, "info", tag, { fontColor: "#00e676" });
    }
    trace(isTrace: boolean) {
        this.tracing = isTrace;
    }
    constructor(_appName: string) {
        this.eventInstance = new EventEmitter();
        let fontColorIndex = Math.floor(Math.random() * FONT_COLOR_DEFAULT_LENGTH);
        let fontColor = FONT_COLOR_DEFAULT[fontColorIndex];
        if(Logger.maxLength <= _appName.length){
            Logger.maxLength = _appName.length;
        }
        else{
            let missingLength = Logger.maxLength - _appName.length;
            for(let i = 0; i < missingLength; i++){
                _appName = " " + _appName;
            }
        }
        this.appName = _appName;
        this.displayAppName = chalk.rgb(fontColor.r, fontColor.g, fontColor.b)(_appName);
        this.on("data", (data) => {
            let outputString = null;
            if(typeof data !== "string"){
                outputString = JSON.stringify(data);
            }
            else{
                outputString = data;
            }
            process.stdout.write(outputString + "\n");
        });
    }
    
}
