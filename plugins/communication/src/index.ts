import { App } from "@base/builder";
import { ICommunication } from "@base/communication";

export interface IExtendCommunication {
    communication: ICommunication;
}
export class ExtendCommunication extends App implements IExtendCommunication{
    communication: ICommunication;
}