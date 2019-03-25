import { UnitOfWork, IBaseEntity } from "@base/interfaces";
import { IDatabaseContext } from "./main/database-context";
import { EventEmitter } from "events";

interface ILogEvent{
	on(event: "data", listener: (...args: any[]) => void): LogEvent;
	pushLog(log: any);
}

export class LogEvent implements ILogEvent{
	private eventInstance: EventEmitter;
	on(event: "data", listener: (...args: any[]) => void): LogEvent {
		this.eventInstance.on(event, listener);
		return this;
	}
	pushLog(log: any){
		this.eventInstance.emit("data", log);
	}
	constructor(){
		this.eventInstance = new EventEmitter();
	}
}

export interface IExtendDatabase{
	db?: UnitOfWork;
	dbContext?: Object;
	log?: ILogEvent;
	connectDatabase?(entities: {[key: string]: {new() : IBaseEntity}}, context: {new (): IDatabaseContext}, unitOfWork: {new(_context: IDatabaseContext): UnitOfWork}) : Promise<boolean>;
	extendDatabase?(plugin: Function | Array<Function>);
	setLog?(hasLog: boolean);
}