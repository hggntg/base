import { Request, Response, NextFunction } from "express";
import { IMiddlewareChainable } from "@app/interface";

interface ISetCredentials extends ICORSMiddlewareChainable{
    setCredentials?<T extends ISetCredentials>(this: T, credentials: boolean): Omit<T, "setCredentials">;
}

interface ISetHeaders extends ICORSMiddlewareChainable{
    setHeaders?<T extends ISetHeaders>(this: T, ...headers: string[]): Omit<T, "setHeaders">;
}

interface ISetMethods extends ICORSMiddlewareChainable{
    setMethods?<T extends ISetMethods>(this: T, ...methods: string[]): Omit<T, "setMethods">;
}

interface ISetExposeHeaders extends ICORSMiddlewareChainable{
    setExposeHeaders?<T extends ISetExposeHeaders>(this: T, ...exposeHeaders: string[]): Omit<T, "setExposeHeaders">;
}

interface ISetOrigin extends ICORSMiddlewareChainable{
    setOrigin?<T extends ISetOrigin>(this: T, origin: string): Omit<T, "setOrigin">;
}

interface ISetRequestHeaders extends ICORSMiddlewareChainable{
    setRequestHeaders?<T extends ISetRequestHeaders>(this: T, ...requestHeaders: string[]): Omit<T, "setRequestHeaders">;
}

interface ISetRequestMethods extends ICORSMiddlewareChainable{
    setRequestMethods?<T extends ISetRequestMethods>(this: T, ...requestMethods: string[]): Omit<T, "setRequestMethods">;
}

interface ICORSMiddlewareChainable extends IMiddlewareChainable{
    setPreflightRule(fn): ICORSMiddlewareChainable;
}

interface ICORSMiddleware extends ISetCredentials, ISetHeaders, ISetMethods, ISetExposeHeaders, ISetOrigin, ISetRequestHeaders, ISetRequestMethods{}

export class CORSMiddleware implements ICORSMiddleware{
    private credentials: boolean;
    private headers: string[];
    private methods: string[];
    private origin: string;
    private exposeHeaders: string[];
    private maxAge: number;
    private requestHeaders: string[];
    private requestMethods: string[];
    private logger: ILogger;

    constructor(){
        this.logger = getDependency<ILogger>(LOGGER_SERVICE);
    }

    setCredentials<T extends ICORSMiddleware>(credentials: boolean): Pick<T, Exclude<keyof T, "setCredentials">> {
        if(typeof this.credentials !== "boolean"){
            this.credentials = credentials;
        }
        return this as any;
    }
    setHeaders<T extends ICORSMiddleware>(...headers: string[]): Pick<T, Exclude<keyof T, "setHeaders">> {
        if(typeof this.headers === "undefined"){
            this.headers = headers;
        }
        return this as any;
    }
    setMethods<T extends ICORSMiddleware>(...methods: string[]): Pick<T, Exclude<keyof T, "setMethods">> {
        if(typeof this.methods === "undefined"){
            this.methods = methods;
        }
        return this as any;
    }
    setExposeHeaders<T extends ICORSMiddleware>(...exposeHeaders: string[]): Pick<T, Exclude<keyof T, "setExposeHeaders">>{
        if(typeof this.exposeHeaders === "undefined"){
            this.exposeHeaders = exposeHeaders;
        }
        return this as any;
    }
    setOrigin<T extends ICORSMiddleware>(origin: string): Pick<T, Exclude<keyof T, "setOrigin">>{
        if(typeof this.origin === "undefined"){
            this.origin = origin;
        }
        return this as any;  
    }
    setMaxAge<T extends ICORSMiddleware>(maxAge: number): Pick<T, Exclude<keyof T, "setMaxAge">>{
        if(typeof this.maxAge !== "number"){
            this.maxAge = maxAge < 0 ? 0 : maxAge;
        }
        return this as any;
    }
    setRequestHeaders<T extends ICORSMiddleware>(...requestHeaders: string[]): Pick<T, Exclude<keyof T, "setRequestHeaders">>{
        if(typeof this.requestHeaders === "undefined"){
            this.requestHeaders = requestHeaders;
        }
        return this as any;
    }
    setRequestMethods<T extends ICORSMiddleware>(...requestMethods: string[]): Pick<T, Exclude<keyof T, "setRequestMethods">>{
        if(typeof this.requestMethods === "undefined"){
            this.requestMethods = requestMethods;
        }
        return this as any;
    }
    setPreflightRule(fn){
        return this;
    }
    toMiddleware(){
        return (req: Request, res: Response, next: NextFunction) => {
            if(!this.credentials) this.credentials = false;
            if(!this.maxAge && this.maxAge !== 0) this.maxAge = 600;
            if(!this.origin) this.origin = "*";
            if(!this.exposeHeaders) this.exposeHeaders = ["Cache-Control", "Content-Language", "Content-Type", "Expires", "Last-Modified", "Pragma"];
            if(!this.headers) this.headers = ["Origin", "Content-Type", "Accept", "Authorization"];
            if(!this.methods) this.methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
            if(!this.requestHeaders) this.requestHeaders = ["Origin", "Content-Type", "Accept", "Authorization"];
            if(!this.requestMethods) this.requestMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

            res.header('Access-Control-Allow-Credentials', `${this.credentials}`);
            res.header('Access-Control-Allow-Origin', this.origin);
            res.header("Access-Control-Allow-Methods", this.methods.join(", "));
            res.header("Access-Control-Allow-Headers", this.headers.join(", "));
            res.header('Access-Control-Allow-Request-Methods', this.requestMethods.join(", "));
            res.header('Access-Control-Allow-Request-Headers', this.requestHeaders.join(", "));
            // res.header('Access-Control-Max-Age', this.maxAge.toString());
            res.header('Access-Control-Allow-Expose-Headers', this.exposeHeaders.join(", "));

            this.logger.pushLog({
                level: "info",
                message: {
                    delimiter: "",
                    tag: "api",
                    messages: [
                        {
                            text: JSON.stringify(req.headers)
                        }
                    ]
                }
            })
            if (req.method === 'OPTIONS') {
                res.status(204).send();
            }
            else {
                next();
            }
        }
    }
}