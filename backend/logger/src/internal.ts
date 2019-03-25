import { EventEmitter } from "events";
import chalk from "chalk";

const chalkConfig = {
    silly: {
        fontColor: "#fafafa"
    },
    debug: {
        fontColor: "#"
    },
    error:{
        fontColor: "#"
    },
    info:{
        fontColor: "#"
    }
}

interface ILogEvent{
	on(event: "data", listener: (...args: any[]) => void): LogEvent;
	pushLog(log: any);
}

export interface IMessage{
    
}

export interface ILog {
    level: "silly" | "debug" | "error" | "info",
    message: string,
    htmlString?: string,
    metadata: any
}

export class LogEvent implements ILogEvent{
	private eventInstance: EventEmitter;
	on(event: "data", listener: (data: string) => void): LogEvent {
		this.eventInstance.on(event, listener);
		return this;
	}
	pushLog(log: ILog){
		this.eventInstance.emit("data", log);
	}
	constructor(){
		this.eventInstance = new EventEmitter();
	}
}
export interface IExtendLogger{
    log?: ILogEvent;

}