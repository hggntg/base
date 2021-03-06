import { Connection } from "amqplib";
import { EventEmitter } from "events";
import { IWorkerJobRequest, IWorker, IWorkerOptions } from "@app/interface";
import { Communication } from "@app/main";

const TIMEOUT = Symbol.for("TIMEOUT");

export interface ICountDown {
    count(): Promise<any>;
    update(): void;
    clear(): void;
}

class CountDown {
    private timeout: number;
    private startTime: number;
    private interval: NodeJS.Timeout
    count(){
        let intervalTimeout = 0;
        if(this.timeout >= 4) intervalTimeout = Math.floor(this.timeout / 4);
        return new Promise((resolve, reject) => {
            this.interval = setInterval(() => {
                let currentTime = (+ new Date());
                if(currentTime - this.startTime >= this.timeout){
                    resolve();
                    this.clear();
                }
            }, intervalTimeout);
        });
    }
    update(){
        this.startTime = (+ new Date());
    }
    clear(){
        clearInterval(this.interval);
    }
    constructor(_timeout: number, _startTime: number){
        this.timeout = _timeout;
        this.startTime = _startTime;
    }
}

export class WorkerJobRequest implements IWorkerJobRequest{
    method: string;
    args: any[];
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
        let countDown = new CountDown(this.timeout, (+new Date()));
        this.args.push(countDown);
        let promise = func.apply(root, this.args) as Promise<any>;
        return Promise.race([promise, new Promise((resolve, reject) => {
            countDown.count().then(() => {
                resolve(TIMEOUT);
            });
        })]).then((value) => {
            if(value === TIMEOUT){
                if(flag++ < this.retry){
                    console.debug("There are something wrong. Retry " + flag + " time(s)");
                    return this.run(func, root, flag);
                }
                else{
                    return Promise.reject(new Error("Timeout"));
                }
            }
            else{
                countDown.clear();
                countDown = undefined;
                return value;
            }
        });
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

    private assertQueue(jobQueue: string, options: IWorkerOptions,  onReceive: (receivedJob: IWorkerJobRequest) => void, usedToFail?: boolean): Promise<boolean>{
        return this.conn.createChannel().then((channel) => {
            console.debug("Ready to receive job from " + jobQueue);
            return Communication.checkAndAssertQueue(channel, jobQueue, {durable: true, maxPriority: options.maxPriority}, usedToFail).then(() => {
                channel.prefetch(options.prefetch);
                let consumerTag = null;
                return channel.consume(jobQueue, async (msg) => {
                    msg.content = await Communication.decompress(msg.content);
                    let data = Communication.reverseBody(msg.content.toString());
                    let content = data.content;
                    let jobRequest = new WorkerJobRequest({...content, retry: options.retry, timeout: options.timeout}, this.logger);
                    console.debug("Received a job");
                    jobRequest.once("finish", (thing) => {
                        if(thing instanceof Error){
                            console.error(thing.message);
                        }
                        else{
                            console.debug(JSON.stringify(thing));
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
        }).catch(e => {
            if(e.name === "WRONG_QUEUE_OPTIONS"){
                return this.assertQueue(jobQueue, options, onReceive, true).then(() => {
                    console.info(e.message);
                    return true;
                });
            }
            else {
                return Promise.reject(e);
            }
        });
    }

    getJob(jobQueue: string, options: IWorkerOptions = {
        maxPriority: 10,
        prefetch: 1,
        retry: 1,
        timeout: 5000
    }, onReceive: (receivedJob: IWorkerJobRequest) => void ) : Promise<boolean>{
        return this.assertQueue(jobQueue, options, onReceive);
    }
}