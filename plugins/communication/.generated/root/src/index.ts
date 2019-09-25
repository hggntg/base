import "./core";
import "./declare";
import { App } from "@base/builder";
import { ICommunication } from "@base/communication";

export interface IExtendCommunication {
    communication: ICommunication;
}
export class ExtendCommunication extends App implements IExtendCommunication{
    communication: ICommunication;

    static getType(): IClassType {
        return Type.get("ExtendCommunication", "class") as IClassType;
    }
}