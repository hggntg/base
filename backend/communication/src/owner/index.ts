import { Connection, Channel } from "amqplib";
import { queue, ErrorCallback } from "async";
import { EventEmitter } from "events";
import { Communication } from "@app/main";
import { IOwner, IOwnerTask, IOwnerJobRequest } from "@app/interface";

export class Owner implements IOwner {
    private readonly conn: Connection;
    private channel: Channel;
    private readonly logger: ILogger;
    private event: EventEmitter;
    private q = queue((task: IOwnerTask, callback) => {
        if (this.channel) {
            return this.sendJobInBack(task, callback).catch(e => {
                if(e.name === "WRONG_QUEUE_OPTIONS"){
                    console.info(e.message);
                    return this.conn.createChannel().then(channel => {
                        this.channel = channel;
                        return this.sendJobInBack(task, callback, true);
                    })
                }
                else {
                    return callback(e);
                }
            });
        }
        else {
            return this.conn.createChannel().then(channel => {
                this.channel = channel;
                this.q.concurrency = this.concurrency;
                return this.sendJobInBack(task, callback).catch(e => {
                    if(e.name === "WRONG_QUEUE_OPTIONS"){
                        console.info(e.message);
                        return this.conn.createChannel().then(channel => {
                            this.channel = channel;
                            return this.sendJobInBack(task, callback, true);
                        })
                    }
                    else {
                        return callback(e);
                    }
                });
            });
        }
    }, 1);
    private concurrency: number = 12;
    constructor(conn: Connection, logger: ILogger) {
        this.conn = conn;
        this.logger = logger;
        this.event = new EventEmitter();
        this.event.on("sendJob", (data: IOwnerTask) => {
            this.q.push(data);
        });
    }

    private sendJobInBack(task: IOwnerTask, callback: ErrorCallback, usedToFail?: boolean) {
        return Communication.checkAndAssertQueue(this.channel, task.jobQueue, { durable: true, maxPriority: 10 }, usedToFail).then(() => {
            let priority = task.ownerJobRequest.priority;
            let jobRequest = {
                method: task.ownerJobRequest.method,
                args: task.ownerJobRequest.args
            };
            Communication.compress(Communication.ensureBodyString({
                from: task.jobQueue,
                content: jobRequest
            })).then(sendingBuffer => {
                let status = this.channel.sendToQueue(task.jobQueue, sendingBuffer, { persistent: true, priority: priority });
                console.info("Pushing job to queue " + task.jobQueue + " is " + (status ? "successfull" : "failed"));
                setTimeout(() => {
                    return callback();
                }, 1);
            }).catch(e => {
                return callback(e);
            });
        });
    }

    pushJob(jobQueue: string, jobRequest: IOwnerJobRequest) {
        let data: IOwnerTask = {
            jobQueue: jobQueue,
            ownerJobRequest: jobRequest
        }
        this.event.emit("sendJob", data);
    }
}