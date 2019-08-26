import { Connection } from "amqplib";
import { ILogger, ILog } from "@base/logger";
import { EventEmitter } from "events";
import { IWorkerJobRequest, IWorker, IWorkerOptions } from "@app/interface";
import { Communication } from "@app/main";

const TIMEOUT = Symbol.for("TIMEOUT");

export class WorkerJobRequest implements IWorkerJobRequest{
    method: string;
    args: [];
    private event: EventEmitter;
    private timeout: number;
    private retry: number;
    private logger: ILogger;
    private logTag: string = "Rabbitmq(WorkerJobRequest)";
    constructor(_logger: ILogger);
    constructor(input: {
        method: string;
        args: [];
        timeout: number;
        retry: number;
    }, _logger: ILogger);
    constructor(arg0: ILogger | {
        method: string;
        args: [];
        timeout: number;
        retry: number;
    }, arg1?: ILogger){
        this.event = new EventEmitter();
        if(arguments.length === 2){
            let input = arg0 as { method: string; args: []; timeout: number; retry: number;}
            this.method = input.method;
            this.args = input.args;
            this.timeout = input.timeout;
            this.retry = input.retry;

            this.logger = arg1 as ILogger;
        }
        else{
            this.logger = arg0 as ILogger;
        }
    }
    start(func: Function, root: any): void {
        this.run(func, root).then(value => {
            this.finish(value);
        }).catch(e => {
            this.finish(e);
        });
    }
    once(event: "finish", listener: (data: any) => void): void{
        this.event.once(event, listener);
    }
    finish(thing: any | Error): void{
        this.event.emit("finish", thing);
    }
    private run(func: Function, root: any, flag: number = 0){
        let promise = func.apply(root, this.args) as Promise<any>;
        return Promise.race([promise, new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(TIMEOUT);
            }, this.timeout);
        })]).then((value) => {
            if(value === TIMEOUT){
                if(flag++ < this.retry){
                    this.logger.pushDebug("There are something wrong. Retry " + flag + " time(s)", this.logTag);
                    return this.run(func, root, flag);
                }
                else{
                    return Promise.reject(new Error("Timeout"));
                }
            }
            else{
                return value;
            }
        });
    }

    static getType(): IClassType {
        return Type.get("WorkerJobRequest", "class") as IClassType;
    }
}

export class Worker implements IWorker {
    private readonly conn: Connection;
    private logger: ILogger;
    private logTag: string = "Rabbitmq(Worker)";
    constructor(_conn: Connection, _logger: ILogger) {
        this.conn = _conn;
        this.logger = _logger;
    }

    getJob(jobQueue: string, options: IWorkerOptions = {
        maxPriority: 10,
        prefetch: 1,
        retry: 1,
        timeout: 5000
    }, onReceive: (receivedJob: IWorkerJobRequest) => void ) : Promise<boolean>{
        return this.conn.createChannel().then(channel => {
            this.logger.pushDebug("Ready to receive job from " + jobQueue, this.logTag);
            channel.assertQueue(jobQueue, { durable: true, maxPriority: options.maxPriority });
            channel.prefetch(options.prefetch);
            let consumerTag = null;
            return channel.consume(jobQueue, async (msg) => {
                msg.content = await Communication.decompress(msg.content);
                let data = Communication.reverseBody(msg.content.toString());
                let content = data.content;
                let jobRequest = new WorkerJobRequest({...content, retry: options.retry, timeout: options.timeout}, this.logger);
                this.logger.pushDebug("Received a job", this.logTag);
                jobRequest.once("finish", (thing) => {
                    if(thing instanceof Error){
                        this.logger.pushError(thing, this.logTag);
                    }
                    else{
                        this.logger.pushDebug(JSON.stringify(thing), this.logTag);
                    }
                    channel.ack(msg);
                });
                return onReceive(jobRequest);
            }, { noAck: false }).then(ok => {
                consumerTag = ok.consumerTag;
                return true;
            }).catch(err => {
                if(consumerTag){
                    return channel.cancel(consumerTag).then(() => {
                        throw new Error(err);
                    }).catch(e => {
                        throw new Error(e);
                    });
                }
                else{
                    throw new Error(err);
                }
            });
        });
    }

    static getType(): IClassType {
        return Type.get("Worker", "class") as IClassType;
    }
}