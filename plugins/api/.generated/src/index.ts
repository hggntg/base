import "./core";
import "./declare";
import { IExtendAPI, IAPI } from "@base/api";
import { App } from "@base/builder";

export class ExtendAPI extends App implements IExtendAPI{
    apiServer: IAPI;

    static getType(): IClassType {
        return Type.get("ExtendAPI", "class") as IClassType;
    }
}