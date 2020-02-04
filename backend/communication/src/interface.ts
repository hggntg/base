import { Message, ConsumeMessage } from "amqplib";

export interface IRpcTemplate {
    queueName: string;
    correlationId: string;
    body: string
}

export interface IWatchman {
    id: string;
    timeout: number;
    time: number;
    interval?: any;
    isDone: boolean;
}

export interface IWatchTeam {
    [key: string]: IWatchman;
}

export interface IRPCBody {
    method: string;
    args: Array<any>;
    hasCallback: boolean;
}

export interface IRPCRequest extends IRPCBody {
    server: IServer;
    rawMessage: ConsumeMessage;
    returnValue<T>(result: IRPCResult<T>);
}

export interface IRPCOption {
    retry?: number;
    timeout?: number;
    durable?: boolean;
}

export interface ITask {
    message: IRpcTemplate,
    options: IRPCOption
}

export interface IClient {
    queueName: string;
    rpcCall(queueName: string, body: IRPCBody, options: IRPCOption): string;
    setOptionForRPCCall(timeout: number, concurrency: number);
    waitForResult(eventName: string): Promise<any>;
    dispose(): void
}

export interface IServer {
    queueName: string;
    publish(): void;
    listen(options: IListenOption): void;
    sendBack(dataBack: any, msg: Message);
    waitForListenData<T>(cb: (data: IRPCRequest) => void): void;
}

export interface IPublisher {
    exchangeName: string;
    eventList: Array<string>;
    registerEvent(eventList): void;
    publish(body: any): void;
    setConcurrency(concurrency: number): void;
}

export interface ISubscriber {
    subscribe(receivedData): void;
    unsubscribe(): void;
}

export interface IRPCResultSingleBody<T> {
    content: T;
}

export interface IRPCResultListBody<T> {
    content: Array<T>;
    page: number;
    recordsPerPage: number;
    numOfPage: number;
    isEnd: boolean;
}

export interface IRPCResult<T> {
    status: number,
    message: string,
    body: IRPCResultSingleBody<T> | IRPCResultListBody<T>
}

export interface ICommunication {
    connect(): Promise<{}>;
    createServer(queueName: string): IServer;
    createClient(queueName: string): IClient;
    createWorker(): IWorker;
    createOwner(): IOwner;
    createPublisher(exchangeName: string): IPublisher;
    createSubscriber(exchangeName: string): ISubscriber;
}

export interface IConnectionOptionObject {
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


export interface IWorkerJobRequest {
    method: string;
    args: Array<any>;
    once(event: "finish", listener: (data: any) => void): void;
    finish(thing: any | Error): void;
    start(func: Function, root: any): void;
}

export interface IWorkerOptions {
    retry?: number;
    timeout?: number;
    maxPriority?: number;
    prefetch?: number;
    durable?: boolean;
}

export interface IWorker {
    getJob(jobQueue: string, options: IWorkerOptions, onReceive: (receivedJob: IWorkerJobRequest) => void);
}

export interface IOwnerTask {
    jobQueue: string;
    ownerJobRequest: IOwnerJobRequest
}

export interface IOwnerJobRequest {
    method: string;
    args: [];
    priority: number;
}

export interface IOwner {
    pushJob(jobQueue: string, jobRequest: IOwnerJobRequest)
}

export type ConnectionOption = string | IConnectionOptionObject;

export interface IListenOption {
    prefecth: number;
    durable?: boolean;
}