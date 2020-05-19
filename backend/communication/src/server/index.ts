import { Connection, Channel, Message, ConsumeMessage } from "amqplib";
import { EventEmitter } from "events";
import { IServer, IListenOption, IRPCResult, IRPCRequest, IRPCBody, IRpcTemplate } from "@app/interface";
import { Communication } from "@app/main";

'use strict';

export class RPCRequest implements IRPCRequest {
    server: IServer;
    rawMessage: ConsumeMessage;
    method: string;
    args: any[];
    hasCallback: boolean;
    returnValue<T>(result: IRPCResult<T>) {
        this.server.sendBack(result, this.rawMessage);
    }
    constructor();
    constructor(input: IRPCBody & { server: IServer, rawMessage: ConsumeMessage })
    constructor(arg0?: IRPCBody & { server: IServer, rawMessage: ConsumeMessage }) {
        this.args = arg0.args;
        this.hasCallback = arg0.hasCallback;
        this.method = arg0.method;
        this.server = arg0.server;
        this.rawMessage = arg0.rawMessage;
    }
}

export class Server implements IServer {
    public queueName: string;

    private readonly conn: Connection;
    private channel: Channel;
    private event: EventEmitter;
    private logger: ILogger;
    private logTag: string = "Rabbitmq(Server)";
    constructor(_queueName: string, _conn: Connection, _logger: ILogger) {
        this.queueName = _queueName;
        this.conn = _conn;
        this.event = new EventEmitter();
        this.logger = _logger;
        this.event.once("LISTEN", (data: IListenOption) => {
            console.info("Starting listen from queue " + this.queueName);
            this.listenInBack(data);
        });
    }
    private listenInBack(options: IListenOption, usedToFail?: boolean) {
        let self = this;
        return this.conn.createChannel().then(channel => {
            this.channel = channel;
            return Communication.checkAndAssertQueue(channel, this.queueName, {durable: false, maxPriority: 10}, usedToFail).then(() => {
                channel.prefetch(options.prefecth);
                return channel.consume(this.queueName, async function (msg) {
                    msg.content = await Communication.decompress(msg.content);
                    let data = Communication.reverseBody(msg.content.toString());
                    let body: IRPCBody = data.content;
                    let request: IRPCRequest = new RPCRequest({
                        server: self,
                        args: body.args,
                        hasCallback: body.hasCallback,
                        method: body.method,
                        rawMessage: msg
                    });
                    self.event.emit("REQUEST", request);
                }).then(ok => {
                    console.info(JSON.stringify(ok));
                });
            });
        }).catch((err: Error) => {
            if(err.name === "WRONG_QUEUE_OPTIONS"){
                return this.listenInBack(options, true).then(() => {
                    console.info(err.message);
                    return true;
                });
            }
            else {
                console.error(err.message);
            }
        });
    }
    publish() {
        console.info("publish");
    }
    listen(options: IListenOption) {
        this.event.emit("LISTEN", options);
    }
    sendBack(dataBack, msg: Message) {
        console.info("Ready to send result back to client " + msg.properties.correlationId);
        Communication.compress(Communication.ensureBodyString({
            to: msg.properties.replyTo,
            content: dataBack,
        })).then(sendingBuffer => {
            this.channel.sendToQueue(msg.properties.replyTo, sendingBuffer, { correlationId: msg.properties.correlationId });
            this.channel.ack(msg);
        });
    }
    waitForListenData(cb: (request: IRPCRequest) => void) {
        this.event.on("REQUEST", (request: IRPCRequest) => {
            console.info("Receive the request from client " + request.rawMessage.properties.correlationId);
            cb(request);
        });
    }
}  