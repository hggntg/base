import { Connection } from "amqplib";
import { EventEmitter } from "events";
import { Communication } from "@app/main";
import { ISubscriber } from "@app/interface";

export class Subscriber implements ISubscriber{
    private readonly conn: Connection;
    private readonly logger: ILogger;
    private exchangeName: string;
    private event: EventEmitter;
    constructor(exchangeName: string, conn: Connection, logger: ILogger) {
        this.conn = conn;
        this.logger = logger;
        this.exchangeName = exchangeName;
        this.event = new EventEmitter();
        this.event.once("subscribe", () => {
            this.conn.createChannel().then(channel => {
                channel.assertExchange(this.exchangeName, "fanout", { durable: false });
                channel.assertQueue("", { exclusive: true }).then(q => {
                    this.logger.pushSilly("[*] Waiting for messages in " + q.queue, "communication");
                    channel.bindQueue(q.queue, this.exchangeName, "");
                    channel.consume(q.queue, (msg) => {
                        this.event.emit("data", { err: null, data: Communication.reverseBody(msg.content.toString()) });
                    }, { noAck: true }).then(ok => {
                        this.logger.pushDebug(JSON.stringify(ok), "communication");
                    }).catch(err => {
                        this.event.emit("data", {err : err, data: null});
                        throw new Error(err);
                    });
                }).catch(err => {
                    throw new Error(err);
                })
            }).catch(err => {
                this.logger.pushError(err, "communication");
            });
        });
    }

    subscribe(receivedData) {
        this.event.emit("subscribe");
        this.event.on("data", receivedData);
    }

    unsubscribe(){
        this.event.removeAllListeners("data");
    }
}