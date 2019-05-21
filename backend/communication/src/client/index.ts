'use strict';
import { Connection, Channel } from "amqplib";
import { EventEmitter } from "events";
import { v4 } from "uuid";
import { queue } from "async"
import { Communication } from "../internal";
import { ILogger } from "@base/logger";
import { Namespace } from "@base/utilities/namespace";

interface rpcTemplate {
    queueName: string;
    correlationId: string;
    body: string
}

interface Watchman {
    id: string;
    timeout: number;
    time: number;
    interval?: any;
    isDone: boolean;
}

class WatchTeam{
    [key: string]: Watchman;
    constructor(){

    }
}
export class Client {
    private readonly conn: Connection;
    private logger: ILogger;
    private logTag: string = "Rabbitmq[Client]";
    private q = queue((task, callback) => {
        let rpcMessage: rpcTemplate = task as any;
        if (this.channel) {
            let status = this.rpcCallInBack(rpcMessage, this.channel);
            this.logger.pushSilly(rpcMessage.correlationId + " send message with status is " + status, this.logTag);
            callback();
        }
        else {
            this.conn.createChannel().then(channel => {
                this.channel = channel;
                this.q.concurrency = this.concurrency;
                let status = this.rpcCallInBack(rpcMessage, this.channel);
                this.logger.pushSilly(rpcMessage.correlationId + " send message with status is " + status, this.logTag);
                callback();
            });
        }
    }, 1);
    private event: EventEmitter;
    private channel: Channel;
    private timeout: number = 20000;
    private concurrency: number = 12;
    private watchTeam: WatchTeam;

    public queueName: string;
    
    constructor(_queueName: string, conn: Connection, _logger: ILogger) {
        this.queueName = _queueName;
        this.conn = conn;
        this.logger = _logger;
        this.event = new EventEmitter();
        this.watchTeam = new WatchTeam();
        this.event.on("rpcCall", (rpcMessage: rpcTemplate) => {
            this.q.push(rpcMessage, (err) => { });
        });
        this.event.on("receive", (data) => {

        });
    }
    private rpcCallInBack(rpcMessage: rpcTemplate, channel: Channel) {
        let correlationId = rpcMessage.correlationId;
        let session = Namespace.create(correlationId);
        let queueNameResult = rpcMessage.queueName + "->" + "rpc_result";
        let self = this;
        let watchman: Watchman = {
            id: correlationId,
            timeout: this.timeout,
            time: (+ new Date()),
            isDone: false
        }
        watchman.interval = setInterval(function () {
            let currentTime = (+new Date());
            if (this.isDone) {
                clearInterval(this.interval);
                this.interval = null;
            }
            else {
                if (currentTime - this.time >= this.timeout) {
                    clearInterval(this.interval);
                    this.interval = null;
                    self.event.emit(this.id, {err: new Error(this.id + " is timeout.........................."), data: null});
                }
            }
        }.bind(watchman), Math.floor(this.timeout / 2));
        this.watchTeam[watchman.id] = watchman;
        session.run(() => {
            channel.assertQueue(queueNameResult, { exclusive: true }).then(q => {
                channel.prefetch(1);
                channel.consume(q.queue, function (msg) {
                    if (Namespace.get(msg.properties.correlationId)) {
                        self.watchTeam[msg.properties.correlationId].isDone = true;
                        clearInterval(self.watchTeam[msg.properties.correlationId].interval);
                        delete self.watchTeam[msg.properties.correlationId];
                        self.event.emit(msg.properties.correlationId, { err: null, data: Communication.reverseBody(msg.content.toString()) });
                        session.dispose();
                        Namespace.destroy(msg.properties.correlationId);
                    }
                }, { noAck: true }).then(ok => {
                    // console.log(ok);
                }).catch(err => {
                    this.logger.pushError(err.message, this.logTag);
                });
            }).catch(err => {
                this.logger.pushError(err.message, this.logTag);
            });
        });
        return channel.sendToQueue(rpcMessage.queueName, Buffer.from(rpcMessage.body), { correlationId: rpcMessage.correlationId, replyTo: queueNameResult, expiration: this.timeout });
    }

    rpcCall(queueName: string, body: any) {
        let correlationId = v4().toString();
        let rpcMessage: rpcTemplate = {
            correlationId: correlationId,
            body: Communication.ensureBodyString(body),
            queueName: queueName
        }
        this.event.emit("rpcCall", rpcMessage);
        return correlationId;
    }
    setOptionForRPCCall(timeout: number, concurrency: number){
        this.timeout = timeout;
        this.concurrency = concurrency
    }
    waitForResult(eventName) {
        return new Promise((resolve, reject) => {
            this.event.once(eventName, (result) => {
                if (result.err) {
                    reject(result.err);
                }
                else {
                    resolve(result.data);
                }
            });
        });
    }
    dispose() {
        this.event.removeAllListeners();
        this.conn.removeAllListeners();
        this.channel.removeAllListeners();
    }
}  