import { App } from "@base/builder";
import { IExtendCommunication, ICommunication } from "@base-interfaces/communication";

export class ExtendCommunication extends App implements IExtendCommunication{
    communication: ICommunication;
    constructor(){
        super();
    }
}