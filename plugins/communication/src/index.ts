import { App } from "@base/builder";
import { ICommunication, ConnectionOption, Communication } from "@base/communication";

export interface IExtendCommunication {
    communication: ICommunication;
    initCommunication?(option: ConnectionOption, logger: ILogger): void;
    establishCommunicationConnection?(): Promise<{}>;
}
export class ExtendCommunication extends App implements IExtendCommunication{
    communication: ICommunication;
    initCommunication(option: ConnectionOption, logger: ILogger){
        this.communication = new Communication(option, logger);
    }
    establishCommunicationConnection(): Promise<{}>{
        return this.communication.connect().catch(e => {
            this.report({
                description: "Rabbitmq is down",
                event: "rabbitmq.down",
                level: "green",
                meta : {},
                needToRestart: true
            });
            return Promise.reject(e);
        });
    }
}