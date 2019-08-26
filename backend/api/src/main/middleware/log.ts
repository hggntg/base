import { IMiddlewareChainable } from "@app/interface";
import { NextFunction, Response, Request } from "express";
import { ILogger, LOGGER_SERVICE } from "@base/logger";
import { getDependency } from "@base/class";

interface ILogMiddleware extends IMiddlewareChainable{}

export class LogMiddleware implements ILogMiddleware{
    private logger: ILogger;
    constructor(){
        this.logger = getDependency<ILogger>(LOGGER_SERVICE);
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
                                fontColor: { r: 216, g: 27, b: 96 }
                            }
                        },
                        {
                            text: req.method,
                            style: {
                                fontColor: { r: 76, g: 175, b: 80 }
                            }
                        },
                        {
                            text: req.url + " HTTP/" + req.httpVersion
                        },
                        {
                            text: res.statusCode.toString(),
                            style: {
                                fontColor: { r: 255, g: 61, b: 0 }
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