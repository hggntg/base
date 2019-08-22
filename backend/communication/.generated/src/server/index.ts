import { Connection, Channel, Message, ConsumeMessage } from "amqplib";
import { EventEmitter } from "events";
import { ILogger } from "@base/logger";
import { IServer, IListenOption, IRPCResult, IRPCRequest, IRPCBody, IRpcTemplate } from "../interface";
import { Communication } from "../main";

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

    static getType(): IClassType {
        return Type.get("RPCRequest", "class") as IClassType;
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
            this.logger.pushInfo("Starting listen from queue " + this.queueName, this.logTag);
            this.listenInBack(data);
        });
    }
    private listenInBack(options: IListenOption) {
        let self = this;
        this.conn.createChannel().then(channel => {
            this.channel = channel;
            channel.assertQueue(this.queueName, { durable: false, maxPriority: 10 });
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
                this.logger.pushInfo(JSON.stringify(ok), this.logTag);
            })
        }).catch((err: Error) => {
            this.logger.pushError(err, this.logTag);
        });
    }
    publish() {
        this.logger.pushSilly("publish", "Rabbitmq[Server]");
    }
    listen(options: IListenOption) {
        this.event.emit("LISTEN", options);
    }
    sendBack(dataBack, msg: Message) {
        this.logger.pushInfo("Ready to send result back to client " + msg.properties.correlationId, this.logTag);
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
            this.logger.pushInfo("Receive the request from client " + request.rawMessage.properties.correlationId, this.logTag);
            cb(request);
        });
    }

    static getType(): IClassType {
        return Type.get("Server", "class") as IClassType;
    }
}  