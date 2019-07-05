'use strict';
import { deflateRaw, inflateRaw } from "zlib";
import { ICommunication, ConnectionOption } from "@base-interfaces/communication"
import { ILogger } from "@base-interfaces/logger";
import { connect, Connection } from "amqplib";
import { Server } from "./server";
import { Client } from "./client";
import { Worker } from "./worker";
import { Owner } from "./owner";

export class Communication implements ICommunication{
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
    createClient(queueName: string){
        return new Client(queueName, this.conn, this.logger);
    }
    createWorker(){
        return new Worker(this.conn, this.logger);
    }
    createOwner(){
        return new Owner(this.conn, this.logger);
    }
    // createPublisher(exchangeName: string){
    //     return new Communication.Publisher(exchangeName, this.conn, this.logger);
    // }
    // createSubscriber(exchangeName: string){
    //     return new Communication.Subscriber(exchangeName, this.conn, this.logger);
    // }
}  
//DEFINE PROTOTYPE

//END OF DEFINE PROTOTYPE