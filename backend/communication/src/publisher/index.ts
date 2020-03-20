import { Connection, Channel } from "amqplib";
import { EventEmitter } from "events";
import { queue } from "async";
import { Communication } from "@app/main";
import { IPublisher } from "@app/interface";

export class Publisher implements IPublisher{
    private readonly conn: Connection;
    private readonly logger: ILogger;
    private event: EventEmitter;
    private q = queue((task, callback) => {
        if(this.channel){
            this.publishInBack(task, callback);
        }
        else{
            this.conn.createChannel().then(channel => {
                this.channel = channel;
                this.publishInBack(task, callback);
                this.q.concurrency = this.concurrency;
            }).catch(err => {
                console.error(err);
                callback();
            })
        }
    }, 1);
    private concurrency: number = 12;
    private channel: Channel;
    public exchangeName: string;
    public eventList: Array<string> = new Array<string>();
    constructor(exchangeName: string, conn: Connection, logger: ILogger){
        this.conn = conn;
        this.logger = logger;
        this.exchangeName = exchangeName;
        this.event = new EventEmitter();
        this.event.on("publish", (data) => {
            this.q.push(data);
        });
    }

    private publishInBack(message, callback){
        this.channel.assertExchange(this.exchangeName, "fanout", { durable: false });
        this.channel.publish(this.exchangeName, "", Buffer.from(Communication.ensureBodyString(message)));
        setTimeout(() => {
            callback();
        }, 1);
    }

    public registerEvent(eventList){
        eventList.map(eventItem => {
            if(this.eventList.indexOf(eventItem) < 0){
                this.eventList.push(eventItem);
            }
        })
    }

    public publish(body: any){
        this.event.emit("publish", body);
    }

    setConcurrency(concurrency: number){
        this.concurrency = concurrency;
    }
}