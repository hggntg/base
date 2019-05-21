import { Connection, Channel, Message } from "amqplib";
import { EventEmitter } from "events";
import { ILogger } from "@base/logger";
import { Communication } from "../internal";

'use strict';

interface ListenOption{
    prefecth: number;
}

export class Server {
    private readonly conn: Connection;
    private channel: Channel;
    private event: EventEmitter;
    private logger: ILogger;
    public queueName: string;
    private logTag: string = "Rabbitmq[Server]";
    constructor(_queueName: string, _conn: Connection, _logger: ILogger) {
        this.queueName = _queueName;
        this.conn = _conn;
        this.event = new EventEmitter();
        this.logger = _logger;
        this.event.once("LISTEN", (data: ListenOption) => {
            this.logger.pushInfo("Starting listen from queue " + this.queueName, this.logTag);
            this.listenInBack(data);
        });
    }
    private listenInBack(options: ListenOption) {
        let self = this;
        this.conn.createChannel().then(channel => {
            this.channel = channel;
            channel.assertQueue(this.queueName, { durable: false, maxPriority: 10 });
            channel.prefetch(options.prefecth);
            return channel.consume(this.queueName, function(msg){
                self.event.emit("REQUEST", msg);
            }).then(ok => {
                this.logger.pushInfo(JSON.stringify(ok), this.logTag);
            })
        }).catch((err: Error) => {
            this.logger.pushError(err.message, this.logTag);
        });
    }
    publish() {
        this.logger.pushSilly("publish", "Rabbitmq[Server]");
    }
    listen(options: ListenOption) {
        this.event.emit("LISTEN", options);
    }
    sendBack(dataBack, msg: Message){
        this.logger.pushInfo("Ready to send result back to client " + msg.properties.correlationId, this.logTag);
        this.channel.sendToQueue(msg.properties.replyTo, Buffer.from(Communication.ensureBodyString(dataBack)), { correlationId: msg.properties.correlationId });
        this.channel.ack(msg);
    }
    waitForListenData(cb) {
        this.event.on("REQUEST", (data) => {
            this.logger.pushInfo("Receive the request from client " + data.properties.correlationId, this.logTag);
            cb(data);
        });
    }
}  