import { IAPI } from "@base/api";
import { App } from "@base/builder";

export interface IExtendAPI {
    apiServer: IAPI;
}

export class ExtendAPI extends App implements IExtendAPI{
    apiServer: IAPI;
}