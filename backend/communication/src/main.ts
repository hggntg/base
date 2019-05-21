'use strict';
import { deflateRaw, inflateRaw } from "zlib";
import { ILogger } from "@base/logger";
import { Server } from "./internal";
// import { Client } from "./client";
// import { Worker } from "./worker";
// import { Owner } from "./owner";
// import { Publisher } from "./publisher";
// import { Subscriber } from "./subscriber";
// import { Logger, LoggerOption } from "../../logger/src";
import { connect, Connection } from "amqplib";
export interface ICommunication{
    connect(): Promise<{}>;
    createServer(queueName: string): Server;
}

export interface ConnectionOptionObject{
    protocol?: string;
    hostname?: string;
    port?: number;
    username?: string;
    password?: string;
    locale?: string;
    frameMax?: number;
    heartbeat?: number;
    vhost?: string;
}

export type ConnectionOption = string | ConnectionOptionObject;

export class Communication implements ICommunication{
    // public static readonly Client = Client;
    // public static readonly Worker = Worker;
    // public static readonly Owner = Owner;
    // public static readonly Publisher = Publisher;
    // public static readonly Subscriber = Subscriber;
    private options: ConnectionOption;
    private conn: Connection;
    private readonly logger: ILogger;
    constructor(_options : ConnectionOption, _logger: ILogger){
        this.options = _options;
        this.logger = _logger;
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
            deflateRaw(input, {chunkSize: 8 * 64}, (err, result) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(result);
                }
            });
        })
    }

    static decompress(input: Buffer): Promise<Buffer>{
        return new Promise<Buffer>((resolve, reject) => {
            inflateRaw(input, {chunkSize: 8 * 64}, (err, result) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(result);
                }
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
    // createClient(queueName: string){
    //     return new Communication.Client(queueName, this.conn, this.logger);
    // }
    // createWorker(queueName: string){
    //     return new Communication.Worker(queueName, this.conn, this.logger);
    // }
    // createOwner(){
    //     return new Communication.Owner(this.conn, this.logger);
    // }
    // createPublisher(exchangeName: string){
    //     return new Communication.Publisher(exchangeName, this.conn, this.logger);
    // }
    // createSubscriber(exchangeName: string){
    //     return new Communication.Subscriber(exchangeName, this.conn, this.logger);
    // }
}  
//DEFINE PROTOTYPE

//END OF DEFINE PROTOTYPE