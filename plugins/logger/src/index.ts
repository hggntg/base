import { IExtendLogger, ILogger } from "@base-interfaces/logger";
import { Logger } from "@base/logger";
import { App } from "@base/builder";

export class ExtendLogger extends App implements IExtendLogger{
    public logger: ILogger;    
    setLog(hasLog: boolean, appName: string) {
        if(hasLog && !this.logger){
            this.logger = new Logger(appName);
        }
    }
}
