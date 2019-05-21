import { App } from "@base/interfaces";
import { IExtendLogger, ILogger } from "@base/logger";
import { Communication, ConnectionOption, IExtendCommunication } from "./internal";

type IExtendApp = App & IExtendCommunication & IExtendLogger;
declare const app: IExtendApp;

app.setCommunication = function(this: IExtendApp, _options: ConnectionOption, _logger: ILogger){
    this.communication = new Communication(_options, _logger);
}

export * from "./internal";