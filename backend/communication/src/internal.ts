import { ICommunication, ConnectionOption } from "./main";
import { ILogger } from "@base/logger";

export interface IExtendCommunication {
    communication?: ICommunication;
    setCommunication?(_options: ConnectionOption, _logger: ILogger);
}
export * from "./main";
export * from "./server";

