import { App } from "@base/interfaces";
import { IExtendLogger, Logger } from "./internal";

declare const app: App & IExtendLogger;

app.setLog = function(this: IExtendLogger, hasLog: boolean = true, _appName: string){
    if(hasLog && !this.logger){
        this.logger = new Logger(_appName);
        this.logger.on("data", (data) => {
            console.log(data);
        });
    }
}

export * from "./internal";