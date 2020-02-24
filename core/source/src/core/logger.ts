import { EventEmitter } from "events";

if("undefined" === typeof global["LOGGER_SERVICE"]){
    global["LOGGER_SERVICE"] = "ILogger";
}

if("undefined" === typeof global["LOGGER_UTILS"]){
    global["LOGGER_UTILS"] = {
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
    };
}

if("undefined" === typeof global["FONT_COLOR_DEFAULT"]){
    global["FONT_COLOR_DEFAULT"] = ["red", "green", "yellow", "blue", "magenta", "cyan", "white"];
}

if("undefined" === typeof global["FONT_COLOR_DEFAULT_LENGTH"]){
    global["FONT_COLOR_DEFAULT_LENGTH"] = FONT_COLOR_DEFAULT.length; 
}


if("undefined" === typeof global["logger"]){
    class Logger extends BaseClass<ILoggerProperty> implements ILogger, IBaseClass<ILoggerProperty> {
        getType(): IClassType {
            throw new Error("Method not implemented.");
        }
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
            return getDependency<ILogger>(LOGGER_SERVICE, true);
        }
        pushLog(log: ILog);
        pushLog(message: string, level: "silly" | "debug" | "error" | "info" | "warn", tag: string, style?: IMessageStyle);
        pushLog(arg0: (string | ILog), arg1?: "silly" | "debug" | "error" | "info" | "warn", arg2?: string, arg3?: IMessageStyle) {
            if(this.tracing){
                if (typeof arg0 === "string") {
                    let outputString = "";
                    let message = arg0 as string;
                    let level = arg1 as "silly" | "debug" | "error" | "info" | "warn";
                    let tag = arg2 as string;
                    let style = arg3 as IMessageStyle;
                    if (style) {
                        if (style.bold) {
                            outputString += `${LOGGER_UTILS.bold}`;
                        }
                        if (style.underline) {
                            outputString += `${LOGGER_UTILS.underline}`;
                        }
                        if (style.fontColor) {
                            outputString += `${LOGGER_UTILS["fg" + style.fontColor]}`;
                        }
                        if (style.backgroundColor) {
                            outputString += `${LOGGER_UTILS["bg" + style.backgroundColor]}`;
                        }
                    }
                    let date = new Date();
                    let dateString = `${LOGGER_UTILS.fgcyan}${date.toISOString()}(${date.toLocaleString()})${LOGGER_UTILS.reset}`;
                    let prefix = `${LOGGER_UTILS.fgwhite}SILLY`;
                    if (level === "debug") {
                        prefix = `${LOGGER_UTILS.fgblue}DEBUG`;
                    }
                    else if (level === "info") {
                        prefix = `${LOGGER_UTILS.fggreen} INFO`;
                    }
                    else if (level === "error") {
                        prefix = `${LOGGER_UTILS.fgred}ERROR`;
                    }
                    else if (level === "warn"){
                        prefix = `${LOGGER_UTILS.fgyellow} WARN`;
                    }
                    prefix += `${LOGGER_UTILS.reset}`;
                    message = `${outputString}${message}${LOGGER_UTILS.reset}`;
                    let resultString = `${this.displayAppName} - ${dateString} - ${prefix}${tag ? " - [" + tag + "]" : ""} - ${message}`;
                    this.eventInstance.emit("data", resultString);
                }
                else {
                    let log = arg0 as ILog;
                    let messageText = [];
                    let tag = log.message.tag;
                    log.message.messages.map(message => {
                        let outputString = "";
                        if (message.style) {
                            if (message.style.fontColor) {
                                outputString += `${LOGGER_UTILS["fg" + message.style.fontColor]}`;
                            }
                            if (message.style.backgroundColor) {
                                outputString += `${LOGGER_UTILS["bg" + message.style.backgroundColor]}`;
                            }
                            if (message.style.bold) {
                                outputString += `${LOGGER_UTILS.bold}`;
                            }
                            if (message.style.underline) {
                                outputString += `${LOGGER_UTILS.underline}`;
                            }
                        }
                        outputString += message.text + `${LOGGER_UTILS.reset}`;
                        messageText.push(outputString);
                    });
                    let date = new Date();
                    let dateString = `${LOGGER_UTILS.fgcyan}${date.toISOString()}(${date.toLocaleString()})${LOGGER_UTILS.reset}`;
                    let prefix = `${LOGGER_UTILS.fgwhite}SILLY`;
                    if (log.level === "debug") {
                        prefix = `${LOGGER_UTILS.fgblue}DEBUG`;
                    }
                    else if (log.level === "info") {
                        prefix = `${LOGGER_UTILS.fggreen} INFO`;
                    }
                    else if (log.level === "error") {
                        prefix = `${LOGGER_UTILS.fgred}ERROR`;
                    }
                    else if (log.level === "warn"){
                        prefix = `${LOGGER_UTILS.fgyellow} WARN`;
                    }
                    prefix += `${LOGGER_UTILS.reset}`;
                    let resultString = `${this.displayAppName} - ${dateString} - ${prefix}${tag ? " - [" + tag +"]" : ""} - ${messageText.join(log.message.delimiter)}`;
                    this.eventInstance.emit("data", resultString);
                }
            }
        }
        pushWarn(message: string, tag: string) {
            if(this.tracing) this.pushLog(message, "warn", tag, { fontColor: "yellow" });
        }
        pushError(message: Error, tag: string);
        pushError(message: string, tag: string);
        pushError(message: Error | string, tag: string){
            if(this.tracing){
                if(typeof message === "string"){
                    this.pushLog(message, "error", tag, { fontColor: "red" });
                }
                else if(message instanceof Error){
                    let errorMessage = `${message.message}`;
                    this.pushLog(errorMessage.trim(), "error", tag, { fontColor: "red" });
                    let stacks = message.stack.split("\n");
                    stacks.map(stack => {
                        this.pushLog(stack.trim(), "error", tag, { fontColor: "red" });
                    });
                }
            }
        }
        pushSilly(message: string, tag: string) {
            if(this.tracing) this.pushLog(message, "silly", tag, { fontColor: "white" });
        }
        pushDebug(message: string, tag: string) {
            if(this.tracing) this.pushLog(message, "debug", tag, { fontColor: "blue" });
        }
        pushInfo(message: string, tag: string){
            if(this.tracing) this.pushLog(message, "info", tag, { fontColor: "green" });
        }
        trace(isTrace: boolean) {
            this.tracing = isTrace;
        }
        constructor() {
            super();
            this.eventInstance = new EventEmitter();
            this.on("data", (data) => {
                let message: string = "";
                if(typeof data !== "string"){
                    message = JSON.stringify(data);
                }
                else{
                    message = data;
                }
                if(message !== "\n"){
                    message = message.replace(/[\n\n]/g, "\n");
                    if(message.lastIndexOf("\n") !== message.length - 1){
                        message += "\n";
                    }
                }
                process.stdout.write(message);
            });
        }
        init(input: Partial<ILoggerProperty>){
            super.init(input);
            let fontColorIndex = Math.floor(Math.random() * FONT_COLOR_DEFAULT_LENGTH);
            let fontColor = FONT_COLOR_DEFAULT[fontColorIndex];
            if(input.appName){
                if(Logger.maxLength <= input.appName.length){
                    Logger.maxLength = input.appName.length;
                }
                else{
                    let missingLength = Logger.maxLength - input.appName.length;
                    for(let i = 0; i < missingLength; i++){
                        input.appName = " " + input.appName;
                    }
                }
                this.appName = input.appName;
                this.displayAppName = `${LOGGER_UTILS["fg" + fontColor]}${input.appName}${LOGGER_UTILS.reset}`;
            }
        }
        
    }
    Injectable(LOGGER_SERVICE, true, true)(Logger);
    global["logger"] = getDependency<ILogger>(LOGGER_SERVICE);
    logger.trace(true);
    
    const logFunc = console.log;
    const warnFunc = console.warn;
    const errorFunc = console.error;
    const debugFunc = console.debug;
    const infoFunc = console.info;
    console.log = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushSilly(outputString, "system");
        }
        catch(e){
            logFunc.apply(console, arguments);
        }
    }
    console.warn = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushWarn(outputString, "system");
        }
        catch(e){
            warnFunc.apply(console, arguments);
        }
    }
    console.error = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushError(outputString, "system");
        }
        catch(e){
            errorFunc.apply(console, arguments);
        }
    }
    console.debug = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushDebug(outputString, "system");
        }
        catch(e){
            debugFunc.apply(console, arguments);
        }
    }
    console.info = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            logger.pushInfo(outputString, "system");
        }
        catch(e){
            infoFunc.apply(console, arguments);
        }
    }
}

if("undefined" === typeof global["generateLog"]) {
    global["generateLog"] = function(): string{
        let length = arguments.length;
        let outputMessage = [];
        for(let i = 0; i < length; i++){
            let key = i.toString();
            if("undefined" === typeof arguments[key]){
                outputMessage.push("undefined");
            }
            else if (arguments[key] === null){
                outputMessage.push("null");
            }
            else if(typeof arguments[key] === "number" || typeof arguments[key] === "boolean"){
                outputMessage.push(arguments[key].toString());
            }
            else if(typeof arguments[key] === "object"){
                outputMessage.push(JSON.circularStringify(arguments[key]));
            }
            else {
                outputMessage.push(arguments[key]);
            }
        }
        let outputString = outputMessage.join(" ").trim();
        return outputString;
    }
}