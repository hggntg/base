import { gzip, gunzip } from "zlib";
import { ICommunication, ConnectionOption } from "@app/interface"
import { ILogger, LOGGER_SERVICE } from "@base/logger";
import { connect, Connection, Channel, Options, Replies } from "amqplib";
import { Server } from "@app/server";
import { Client } from "@app/client";
import { Worker } from "@app/worker";
import { Owner } from "@app/owner";
import { getDependency } from "@base/class";

export class Communication implements ICommunication{
    private options: ConnectionOption;
    private conn: Connection;
    private readonly logger: ILogger;
    private static logger: ILogger;
    constructor(_options : ConnectionOption, _logger: ILogger){
        this.options = _options;
        this.logger = _logger;
        if(!Communication.logger){
            Communication.logger = getDependency<ILogger>(LOGGER_SERVICE);
        }
    }
    static ensureBodyString(body: any) {
        if (Array.isArray(body) || typeof body === "object") {
            return JSON.stringify(body);
        }
        else {
            if (typeof body !== "undefined" && body !== null) {
                return body.toString();
            }
            else {
                return "";
            }
        }
    }
    static reverseBody(body: string) {
        let result = null;
        try {
            result = JSON.parse(body);
        }
        catch (e) {
            result = body;
        }
        return result;
    }

    static compress(input: Buffer | string): Promise<Buffer>{
        return new Promise<Buffer>((resolve, reject) => {
            if(input instanceof Buffer){
                input = input.toString();
            }     
            let json = "";
            if(typeof input !== "string"){
                json = JSON.stringify(input);
            }
            else{
                json = input;
            }
            let buffer = Buffer.from(json);
            gzip(buffer, { level : 5 }, (err, compressBuffer) => {
                if(err) reject(err);
                else{
                    gzip(compressBuffer, {level: 5}, (err, compressBuffer) => {
                        if(err) reject(err);
                        else resolve(compressBuffer);
                    });
                }
            });
        })
    }

    static decompress(input: Buffer): Promise<Buffer>{
        return new Promise<Buffer>((resolve, reject) => {
            gunzip(input, {level: 5}, (err, decompressBuffer) => {
                if(err){
                    reject(err);
                }
                else{
                    gunzip(decompressBuffer, {level : 5 }, (err, decompressBuffer) => {
                        if(err){
                            reject(err);
                        }
                        else{
                            resolve(decompressBuffer);
                        }
                    });
                }
            });
        });
    }
    static checkAndAssertQueue(channel: Channel, queueName: string, options: Options.AssertQueue): Promise<Replies.AssertQueue>{
        return channel.assertQueue(queueName, options).then((queueResult) => {
            return queueResult;
        }).catch(e => {
            this.logger.pushError(e, "communication");
            return channel.checkQueue(queueName).then((queueResult) => {
                return channel.assertQueue(queueResult.queue).then(() => {
                    this.logger.pushInfo("You assert to queue " + queueName + " but not with your configs", "communication");
                    return queueResult;            
                });
            });
        });
    }

    connect(){
        return new Promise((resolve, reject) => {
            connect(this.options).then(conn => {
                this.conn = conn;
                resolve(true);
            }).catch(err => {
                reject(err);
            });
        });
    }
    createServer(queueName: string){
        return new Server(queueName, this.conn, this.logger);
    }
    createClient(queueName: string){
        return new Client(queueName, this.conn, this.logger);
    }
    createWorker(){
        return new Worker(this.conn, this.logger);
    }
    createOwner(){
        return new Owner(this.conn, this.logger);
    }

    static getType(): IClassType {
        return Type.get("Communication", "class") as IClassType;
    }
}