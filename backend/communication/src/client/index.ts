'use strict';
import { Connection, Channel } from "amqplib";
import { EventEmitter } from "events";
import { v4 } from "uuid";
import { queue } from "async"
import { Communication } from "@app/main";
import { IClient, IRpcTemplate, IRPCBody, IRPCOption, ITask, IRPCResult, IRPCResultListBody, IRPCResultSingleBody } from "@app/interface";

export class RPCResult<T> implements IRPCResult<T>{
    status: number;
    message: string;
    body: IRPCResultListBody<T> | IRPCResultSingleBody<T>;
    constructor();
    constructor(input: IRPCResult<T>);
    constructor(arg0?: IRPCResult<T>) {
        this.status = arg0.status;
        this.message = arg0.message;
        this.body = arg0.body;
    }
    result() {
        return new RPCPlainResult(this.body);
    }
}

class RPCPlainResult<T>{
    private body: IRPCResultListBody<T> | IRPCResultSingleBody<T>;
    list(): IRPCResultListBody<T> {
        if (Array.isArray(this.body.content)) {
            return this.body as IRPCResultListBody<T>;
        }
        else {
            throw new Error("RPC Result is not a list");
        }
    }
    single(): IRPCResultSingleBody<T> {
        if (!Array.isArray(this.body.content)) {
            return this.body as IRPCResultSingleBody<T>;
        }
        else {
            throw new Error("RPC Result is not a single");
        }
    }
    constructor();
    constructor(input: IRPCResultListBody<T> | IRPCResultSingleBody<T>);
    constructor(arg0?: IRPCResultListBody<T> | IRPCResultSingleBody<T>) {
        this.body = arg0;
    }
}

export class Client implements IClient {
    private readonly conn: Connection;
    private logger: ILogger;
    private logTag: string = "Rabbitmq(Client)";
    private q = queue((task: ITask, callback) => {
        let rpcMessage: IRpcTemplate = task.message;
        let options: IRPCOption = task.options;
        if (this.channel) {
            return this.rpcCallInBack(rpcMessage, options, this.channel).then(status => {
                if (status) {
                    console.debug("Successfully preparing message for rpc request");
                }
                callback();
            }).catch(err => {
                if(err.name === "WRONG_QUEUE_OPTIONS"){
                    return this.conn.createChannel().then(channel => {
                        this.channel = channel;
                        return this.rpcCallInBack(rpcMessage, options, this.channel, true).then(status => {
                            if(status){
                                console.debug("Successfully preparing message for rpc request");
                            }
                            callback();
                        }).catch(e => {
                            console.error(e);
                            callback(); 
                        });
                    });
                }
                else {
                    console.error(err);
                    return callback();   
                }
            });
        }
        else {
            return this.conn.createChannel().then(channel => {
                this.channel = channel;
                this.q.concurrency = this.concurrency;
                return this.rpcCallInBack(rpcMessage, options, this.channel).then(status => {
                    if (status) {
                        console.debug("Successfully preparing message for rpc request");
                    }
                    callback();
                }).catch(err => {
                    if(err.name === "WRONG_QUEUE_OPTIONS"){
                        return this.conn.createChannel().then(channel => {
                            this.channel = channel;
                            return this.rpcCallInBack(rpcMessage, options, this.channel, true).then(status => {
                                if(status){
                                    console.debug("Successfully preparing message for rpc request");
                                }
                                callback();
                            }).catch(e => {
                                console.error(e);
                                callback(); 
                            });
                        });
                    }
                    else {
                        console.error(err);
                        return callback();   
                    }
                });
            });
        }
    }, 1);
    private event: EventEmitter;
    private channel: Channel;
    private timeout: number = 20000;
    private concurrency: number = 12;

    public queueName: string;

    constructor(_queueName: string, conn: Connection, _logger: ILogger) {
        this.queueName = _queueName;
        this.conn = conn;
        this.logger = _logger;
        this.event = new EventEmitter();
        this.event.on("rpcCall", (rpcMessage: IRpcTemplate, options: IRPCOption) => {
            this.q.push({ message: rpcMessage, options }, (err) => { });
        });
    }


    private rpcCallInBack(rpcMessage: IRpcTemplate, options: IRPCOption, channel: Channel, usedToFail?: boolean) {
        let correlationId = rpcMessage.correlationId;
        let queueNameResult = rpcMessage.queueName + "->" + correlationId;
        let self = this;

        let context = Namespace.create(correlationId);
        return context.run(async () => {
            context.set("correlationId", correlationId);
            context.set("queueNameResult", queueNameResult);
            let resultQueue = context.get<string>("queueNameResult");
            let outerId = context.getCurrentId();
            context.holdById(outerId);
            try {
                return await Communication.checkAndAssertQueue(channel, resultQueue, { exclusive: true, autoDelete: true }, usedToFail).then((q) => {
                    console.debug("Ready to receive result");
                    channel.prefetch(1);
                    return channel.consume(q.queue, async function (msg) {
                        let currentCorrelationId = context.getValueById<string>(outerId, "correlationId");
                        if (correlationId === currentCorrelationId) {
                            let watcher = context.getValueById<NodeJS.Timeout>(outerId, "watcher");
                            clearTimeout(watcher);
                            self.logger.pushDebug("Receive a result from " + q.queue, self.logTag);
                            msg.content = await Communication.decompress(msg.content);
                            let data = Communication.reverseBody(msg.content.toString());
                            self.event.emit(msg.properties.correlationId, { err: null, data: data.content });
                            let consumerTag = context.getValueById<string>(outerId, "consumerTag");
                            if (consumerTag) {
                                channel.cancel(consumerTag).then(() => { });
                            }
                            context.flush(outerId, true);
                            Namespace.destroy(correlationId);
                        }
                    }, { noAck: true });
                }).then((ok) => {
                    context.setValueById(outerId, "consumerTag", ok.consumerTag);
                    console.debug("Send request to " + rpcMessage.queueName);
                    let consumerTag = ok.consumerTag;
                    let flag = 0;
                    let watcher = setTimeout((consumerTag: string, correlationId: string, options: IRPCOption) => {
                        if (flag++ < options.retry) {
                            watcher.refresh();
                            console.debug("Request " + correlationId + " retries " + flag + " time(s)");
                        }
                        else {
                            if (consumerTag) {
                                channel.cancel(consumerTag).then(() => {
                                    console.error("Request " + correlationId + " reached the timeout");
                                });
                            }
                        }
                    }, options.timeout, consumerTag, correlationId, options);
                    context.setValueById(outerId, "watcher", watcher);
                    return ok;
                });
            }
            catch (e) {
                throw e;
            }
        }).then(async () => {
            let timeout = (options.timeout * options.retry);
            let sendingBuffer = await Communication.compress(rpcMessage.body);
            return channel.sendToQueue(rpcMessage.queueName, sendingBuffer, { correlationId: rpcMessage.correlationId, replyTo: queueNameResult, expiration: timeout });
        });
    }

    rpcCall(queueName: string, body: IRPCBody, options?: IRPCOption) {
        let correlationId = v4().toString();
        let rpcMessage: IRpcTemplate = {
            correlationId: correlationId,
            body: Communication.ensureBodyString({
                to: queueName,
                content: body
            }),
            queueName: queueName
        }
        if (!options) {
            options = {
                retry: 1,
                timeout: 5000
            }
        }
        if (!options.retry) options.retry = 1;
        if (!options.timeout) options.timeout = 5000;
        this.event.emit("rpcCall", rpcMessage, options);
        return correlationId;
    }
    setOptionForRPCCall(timeout: number, concurrency: number) {
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