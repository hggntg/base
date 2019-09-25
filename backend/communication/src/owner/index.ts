import { Connection, Channel } from "amqplib";
import { queue, ErrorCallback } from "async";
import { EventEmitter } from "events";
import { Communication } from "@app/main";
import { ILogger } from "@base/logger";
import { IOwner, IOwnerTask, IOwnerJobRequest } from "@app/interface";

export class Owner implements IOwner {
    private readonly conn: Connection;
    private channel: Channel;
    private readonly logger: ILogger;
    private event: EventEmitter;
    private q = queue((task: IOwnerTask, callback) => {
        if (this.channel) {
            this.sendJobInBack(task, callback);
        }
        else {
            this.conn.createChannel().then(channel => {
                this.channel = channel;
                this.sendJobInBack(task, callback);
                this.q.concurrency = this.concurrency;
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

    private sendJobInBack(task: IOwnerTask, callback: ErrorCallback) {
        Communication.checkAndAssertQueue(this.channel, task.jobQueue, { durable: true, maxPriority: 10 }).then(() => {
            let priority = task.ownerJobRequest.priority;
            let jobRequest = {
                method: task.ownerJobRequest.method,
                args: task.ownerJobRequest.args
            };
            Communication.compress(Communication.ensureBodyString({
                from: task.jobQueue,
                content: jobRequest
            })).then(sendingBuffer => {
                this.channel.sendToQueue(task.jobQueue, sendingBuffer, { persistent: true, priority: priority });
                setTimeout(() => {
                    callback();
                }, 1);
            }).catch(e => {
                callback(e);
            });
        }).catch(e => {
            callback(e);
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