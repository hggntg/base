import { IExtendAPI, IAPI } from "@base/api";
import { App } from "@base/builder";

export class ExtendAPI extends App implements IExtendAPI{
    apiServer: IAPI;
}