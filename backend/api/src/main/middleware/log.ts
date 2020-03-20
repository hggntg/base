import { IMiddlewareChainable } from "@app/interface";
import { NextFunction, Response, Request } from "express";

interface ILogMiddleware extends IMiddlewareChainable{
    trace(tracing: boolean): Omit<ILogMiddleware, "trace">;
}

export class LogMiddleware implements ILogMiddleware{
    private logger: ILogger;
    constructor(){
        let logger = getDependency<ILogger>(LOGGER_SERVICE);
        this.logger = logger.expand();
    }
    trace(tracing: boolean): Pick<ILogMiddleware, "toMiddleware"> {
        this.logger.trace(tracing);
        return this;
    }
    toMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
        return (req, res, next) => {
            this.logger.pushLog({
                level: "info",
                message: {
                    delimiter: " ",
                    tag: "API",
                    messages: [
                        {
                            text: (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].toString() : null) || req.connection.remoteAddress,
                            style: {
                                fontColor: "magenta" as TColor
                            }
                        },
                        {
                            text: req.method,
                            style: {
                                fontColor: "cyan" as TColor
                            }
                        },
                        {
                            text: req.url + " HTTP/" + req.httpVersion
                        },
                        {
                            text: res.statusCode.toString(),
                            style: {
                                fontColor: "green" as TColor
                            }
                        },
                        {
                            text: req.headers["user-agent"],
                        }
                    ]
                }
            });
            next();
        }
    }

}