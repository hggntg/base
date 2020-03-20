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
    class Logger implements ILogger, IBaseClass<ILoggerProperty> {
        static maxLength: number = 0;
        private logColor: boolean;
        private tracing: boolean;
        private eventInstance: EventEmitter;
        private appName: string;
        private displayAppName: string;
        private showAppName: boolean;
        private currentLogLevel: "silly" | "info" | "debug" | "warn" | "error";
        private logLevels = {
            silly: ["silly", "info", "debug", "warn", "error"],
            info: ["info", "debug", "warn", "error"],
            debug: ["info", "debug", "warn", "error"],
            warn: ["info", "warn", "error"],
            error: ["info", "error"]
        }
        private on(event: "data", listener: (data: string) => void): ILogger {
            this.eventInstance.on(event, listener);
            return this;
        }
        private loggable(level: "silly" | "debug" | "error" | "info" | "warn"){
            return this.tracing && this.logLevels[this.currentLogLevel].includes(level);
        }
        private styleMessage(style: Partial<IMessageStyle>){
            let outputString: string = "";
            if(this.logColor){
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
            return outputString;
        }
        expand(): ILogger {
            let newLogInstance = getDependency<ILogger>(LOGGER_SERVICE, true);
            newLogInstance.init({appName: this.appName, logColor: this.logColor});
            newLogInstance.trace(this.tracing);
            newLogInstance.setLevel(this.currentLogLevel);
            newLogInstance.setColor(this.logColor);
            newLogInstance.setDisplayAppName(this.showAppName);
            return newLogInstance;
        }
        setColor(logColor: boolean) {
            this.logColor = logColor;
        }
        setDisplayAppName(showAppName: boolean){
            this.showAppName = showAppName;
        }
        setLevel(level: "silly" | "debug" | "error" | "info" | "warn") {
            this.currentLogLevel = level;
        }
        pushLog(log: ILog);
        pushLog(message: string, level: "silly" | "debug" | "error" | "info" | "warn", tag: string, style?: IMessageStyle);
        pushLog(arg0: (string | ILog), arg1?: "silly" | "debug" | "error" | "info" | "warn", arg2?: string, arg3?: IMessageStyle) {
            if (typeof arg0 === "string" && this.loggable(arg1)) {
                let outputString = "";
                let message = arg0 as string;
                let level = arg1 as "silly" | "debug" | "error" | "info" | "warn";
                let tag = arg2 as string;
                let style = arg3 as IMessageStyle;
                if (style) {
                    outputString += this.styleMessage(style);
                }
                let date = new Date();
                let dateString = `${this.styleMessage({fontColor: "cyan"}) + date.toISOString()}(${date.toLocaleString()})${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let prefix = `${this.styleMessage({fontColor: "white"})}SILLY`;
                if (level === "debug") {
                    prefix = `${this.styleMessage({fontColor: "blue"})}DEBUG`;
                }
                else if (level === "info") {
                    prefix = `${this.styleMessage({fontColor: "green"})} INFO`;
                }
                else if (level === "error") {
                    prefix = `${this.styleMessage({fontColor: "red"})}ERROR`;
                }
                else if (level === "warn"){
                    prefix = `${this.styleMessage({fontColor: "yellow"})} WARN`;
                }
                prefix += `${this.logColor ? LOGGER_UTILS.reset : ""}`;
                message = `${outputString}${message}${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let resultString = (this.showAppName ? `${this.displayAppName} - ` : "" ) + `${dateString} - ${prefix}${tag ? " - [" + tag + "]" : ""} - ${message}`;
                this.eventInstance.emit("data", resultString);
            }
            else if(arg0 && this.loggable((<ILog>arg0).level)){
                let log = arg0 as ILog;
                let messageText = [];
                let tag = log.message.tag;
                log.message.messages.map(message => {
                    let outputString = "";
                    if (message.style) {
                        outputString += this.styleMessage(message.style);
                    }
                    outputString += message.text + `${this.logColor ? LOGGER_UTILS.reset : ""}`;
                    messageText.push(outputString);
                });
                let date = new Date();
                let dateString = `${this.styleMessage({fontColor: "cyan"})}${date.toISOString()}(${date.toLocaleString()})${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let prefix = `${this.styleMessage({fontColor: "white"})}SILLY`;
                if (log.level === "debug") {
                    prefix = `${this.styleMessage({fontColor: "blue"})}DEBUG`;
                }
                else if (log.level === "info") {
                    prefix = `${this.styleMessage({fontColor: "green"})} INFO`;
                }
                else if (log.level === "error") {
                    prefix = `${this.styleMessage({fontColor: "red"})}ERROR`;
                }
                else if (log.level === "warn"){
                    prefix = `${this.styleMessage({fontColor: "yellow"})} WARN`;
                }
                prefix += `${this.logColor ? LOGGER_UTILS.reset : ""}`;
                let resultString = (this.showAppName ? `${this.displayAppName} - ` : "" ) + `${dateString} - ${prefix}${tag ? " - [" + tag +"]" : ""} - ${messageText.join(log.message.delimiter)}`;
                this.eventInstance.emit("data", resultString);
            }
        }
        pushWarn(message: string, tag: string) {
            this.pushLog(message, "warn", tag, { fontColor: "yellow" });
        }
        pushError(message: string, tag: string){
            this.pushLog(message, "error", tag, { fontColor: "red" });
        }
        pushSilly(message: string, tag: string) {
            this.pushLog(message, "silly", tag, { fontColor: "white" });
        }
        pushDebug(message: string, tag: string) {
            this.pushLog(message, "debug", tag, { fontColor: "blue" });
        }
        pushInfo(message: string, tag: string){
            this.pushLog(message, "info", tag, { fontColor: "green" });
        }
        trace(tracing: boolean) {
            this.tracing = tracing;
        }
        constructor() {
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
            this.showAppName = true;
            this.logColor = true;
            this.currentLogLevel = "silly";
        }
        init(input: Partial<ILoggerProperty>){
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
                this.displayAppName = `${this.styleMessage({fontColor: fontColor})}${input.appName}${this.logColor ? LOGGER_UTILS.reset : ""}`;
            }
        }
        
    }
    Injectable(LOGGER_SERVICE, true, true)(Logger);
    global["logger"] = getDependency<ILogger>(LOGGER_SERVICE);
    
    logger.trace(true);
    logger.setColor(true);
    logger.setDisplayAppName(true);
    
    console.log = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushSilly(outputString, "system");
        }
        catch(e){
            system.error(e);
            system.log.apply(console, arguments);
        }
    }
    console.warn = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushWarn(outputString, "system");
        }
        catch(e){
            system.warn.apply(console, arguments);
        }
    }
    console.error = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushError(outputString, "system");
        }
        catch(e){
            system.error.apply(console, arguments);
        }
    }
    console.debug = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushDebug(outputString, "system");
        }
        catch(e){
            system.debug.apply(console, arguments);
        }
    }
    console.info = function(){
        try{
            let outputString = generateLog.apply(null, arguments);
            if(outputString) logger.pushInfo(outputString, "system");
        }
        catch(e){
            system.info.apply(console, arguments);
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
            else if(BaseError.isInstance(arguments[key])){
                let error: IBaseError = arguments[key];
                if(!error.logged){
                    outputMessage.push(error.stack);
                    error.logged = true;
                }
            }
            else if(arguments[key] instanceof Error){
                outputMessage.push(arguments[key].stack);
            }
            else if(typeof arguments[key] === "object"){
                if(typeof arguments[key].toString === "function" && !Array.isArray(arguments[key]) && arguments[key].toString() !== "[object Object]") outputMessage.push(arguments[key].toString());
                else outputMessage.push(JSON.__base__circularStringify(arguments[key]));    
            }
            else {
                outputMessage.push(arguments[key]);
            }
        }
        let outputString = outputMessage.join(" ").trim();
        return outputString;
    }
}