import { EventEmitter } from "events";
import chalk from "chalk";

const FONT_COLOR_DEFAULT = [
    {r: 233, g: 30, b: 99},
    {r: 213, g: 0, b: 249},
    {r: 255, g: 82, b: 82},
    {r: 33, g: 150, b: 243},
    {r: 230, g: 81, b: 0},
    {r: 255, g: 61, b: 0},
    {r: 255, g: 255, b: 0}
];
const FONT_COLOR_DEFAULT_LENGTH = FONT_COLOR_DEFAULT.length;
export interface IMessageStyle{
    bold?: boolean,
    underline?: boolean,
    fontColor?: string | {r: number, g: number, b: number},
    backgroundColor?: string | {r: number, g: number, b: number}
}
export interface IMessageSegment{
    messages: Array<IMessage>;
    delimiter: string;
}

export interface IMessage{
    text: string;
    style?: IMessageStyle;
}
export interface ILog {
    level: "silly" | "debug" | "error" | "info",
    message: IMessageSegment,
    htmlString?: string,
    metadata?: any
}
export interface ILogger{
	on(event: "data", listener: (data: string) => void): ILogger;
	pushLog(log: ILog);
}
export interface IExtendLogger{
    logger?: ILogger;
    setLog?(hasLog: boolean, appName: string);
}


export class Logger implements ILogger{
    private eventInstance: EventEmitter;
    private appName: string;
	on(event: "data", listener: (data: string) => void): ILogger {
		this.eventInstance.on(event, listener);
		return this;
	}
	pushLog(log: ILog){
        let messageText = [];
        log.message.messages.map(message => {
            let ctx = new chalk.constructor();
            if(message.style){
                if(message.style.fontColor){
                    if(typeof message.style.fontColor === "string"){
                        ctx = ctx.hex(message.style.fontColor);
                    }
                    else{
                        ctx = ctx.rgb(message.style.fontColor.r, message.style.fontColor.g, message.style.fontColor.b);
                    }
                }
                if(message.style.backgroundColor){
                    if(typeof message.style.backgroundColor === "string"){
                        ctx = ctx.bgHex(message.style.backgroundColor);
                    }
                    else{
                        ctx = ctx.bgRgb(message.style.backgroundColor.r, message.style.backgroundColor.g, message.style.backgroundColor.b);
                    }
                }
                if(message.style.bold){
                    ctx = ctx.bold;
                }
                if(message.style.underline){
                    ctx = ctx.underline;
                }
            }
            if(typeof ctx !== "function"){
                messageText.push(message.text);
            }
            else{
                messageText.push(ctx(message.text));                
            }
        });
        let dateString = chalk.rgb(255, 255, 255)(new Date().toISOString() + " ---- ");
        let prefix = chalk.rgb(250, 250, 250)("SILLY : ");
        if(log.level === "debug"){
            prefix = chalk.rgb(13, 71, 161)("DEBUG : ");
        }
        else if(log.level === "info"){
            prefix = chalk.rgb(0, 230, 118)("INFO : ");
        }
        else if(log.level === "error"){
            prefix = chalk.rgb(244, 67, 54)("ERROR : ");
        }
        let resultString = this.appName + dateString + prefix + messageText.join(log.message.delimiter);
		this.eventInstance.emit("data", resultString);
	}
	constructor(_appName: string){
        this.eventInstance = new EventEmitter();
        let fontColorIndex = Math.floor(Math.random() * FONT_COLOR_DEFAULT_LENGTH);
        let fontColor = FONT_COLOR_DEFAULT[fontColorIndex];
        this.appName = chalk.rgb(fontColor.r, fontColor.g, fontColor.b)(_appName + " | ");
	}
}
