import jwt from "jsonwebtoken";
import LRU from "lru-cache";
import { JwtObject, IJwToken } from "./model/jwt.model";
import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import express from "express";

const changeLetters = [
    { from: "E", to: "\$" },
    { from: "T", to: "\%" },
    { from: "G", to: "\^" },
    { from: "X", to: "\&" },
    { from: "Z", to: "\@" }
]

function encode(token: string) {
    let base64 = Buffer.from(token, "utf-8").toString("base64");
    changeLetters.map(letter => {
        base64 = base64.replace(new RegExp(letter.from, "g"), letter.to);
    });
    base64 = Buffer.from(base64, "utf-8").toString("base64");
    return base64;
}

function decode(encodedToken: string) {
    let token = "";
    encodedToken = Buffer.from(encodedToken, "base64").toString("utf-8");
    changeLetters.map(letter => {
        encodedToken = encodedToken.replace(new RegExp("\\" + letter.to, "g"), letter.from);
    });
    token = Buffer.from(encodedToken, "base64").toString("utf-8");
    return token;
}

export const MICRO_AUTH_SERVICE = "IMicroAuth";

interface IMicroAuth {
    storePath: string;
    dbPath: string;
    secret: string;
    hasStore: boolean;
}

interface IMicroAuthMethod {
    create(info: JwtObject, options: jwt.SignOptions, secret?: string): string;
    check(token: string, secret?: string): JwtObject;
    toBlacklist(token: string, secret?: string): boolean;
    toMiddleware(): (req: express.Request, res: express.Response, next: express.NextFunction) => void;
}

@Injectable(MICRO_AUTH_SERVICE, true)
export class MicroAuth implements IBaseClass<IMicroAuth>, IMicroAuthMethod{
    private localDb: JsonDB;
    private storePath: string;
    private cache: LRU<string, string>;
    private logger: ILogger = getDependency<ILogger>(LOGGER_SERVICE);
    private secret: string;
    private isInited: boolean = false;
    private hasStore: boolean = false;
    create(info: JwtObject, options: jwt.SignOptions, secret?: string): string {
        if (this.hasStore) {
            let token = this.cache.get(info.idt);
            if (!token) {
                token = jwt.sign(info, secret || this.secret, options);
                this.logger.pushDebug(`Create token ${token}`, "auth");
                let cacheMaxAge = (options.expiresIn as number) * 1000;
                this.cache.set(info.idt, token, cacheMaxAge);
                let exp = (+new Date()) + (options.expiresIn as number) * 1000;
                let jwToken: IJwToken = { id: info.idt, token: token, exp: exp };
                this.localDb.push(this.storePath + "/" + jwToken.id, jwToken);
            }
            return encode(token);
        }
        else {
            let token = jwt.sign(info, this.secret, options);
            this.logger.pushDebug(`Create token ${token}`, "auth");
            return encode(token);
        }
    }
    check(token: string, secret?: string): JwtObject {
        try {
            token = decode(token);
            let decodedObject = jwt.verify(token, secret || this.secret) as JwtObject;
            if (this.hasStore) {
                if (this.cache.get(decodedObject.idt)) {
                    return decodedObject;
                }
                else {
                    return null;
                }
            }
            else {
                return decodedObject;
            }
        }
        catch (e) {
            throw e;
        }
    }
    toBlacklist(token: string, secret?: string): boolean {
        if (this.hasStore) {
            try {
                let jwtObject = this.check(token, secret);
                if (jwtObject) {
                    this.cache.del(jwtObject.idt);
                    return true;
                }
                else {
                    let errorString = `Token ${token} is invalid`;
                    throw new Error(errorString);
                }
            }
            catch (e) {
                let errorString = "";
                if (e instanceof jwt.TokenExpiredError) {
                    errorString += `Token ${token} is expired`;
                }
                else if (e instanceof jwt.JsonWebTokenError) {
                    errorString += `Token ${token} is invalid`;
                }
                else if (e instanceof jwt.NotBeforeError) {
                    errorString += `Token ${token} is not active`;
                }
                else {
                    errorString += `${e.message}`;
                }
                throw new Error(errorString);
            }
        }
        else {
            return true;
        }
    }
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    initValue(input: Partial<IMicroAuth>): void {
        if (!this.isInited) {
            this.isInited = true;
            this.hasStore = input.hasStore || false;
            this.secret = input.secret;
            if (this.hasStore) {
                this.storePath = input.storePath;
                this.localDb = new JsonDB(new Config(input.dbPath), true, true, "/");
                let that = this;
                this.cache = new LRU<string, string>({
                    maxAge: 60 * 60 * 1000,
                    dispose: function (key: string, value: string) {
                        that.logger.pushSilly(`${key} ---- ${value}`, "auth");
                        if (key && value) {
                            that.logger.pushDebug(`Removing token ${value}`, "auth");
                            that.localDb.delete(`${that.storePath}/${key}`);
                            that.localDb.save();
                        }
                    }
                });
                try {
                    this.logger.pushDebug("Restoring tokens in store", "auth");
                    let data: { [key: string]: IJwToken } = {};
                    try {
                        data = this.localDb.getData(this.storePath);
                    }
                    catch (e) {
                        console.warn(e.message);
                    }
                    let current = (+new Date());
                    let removedIndexes = [];
                    let keys = Object.keys(data);
                    this.logger.pushDebug(JSON.stringify(data), "auth");
                    Object.values(data).map((jwToken: IJwToken, index) => {
                        let expire = jwToken.exp;
                        if (expire <= current) {
                            removedIndexes.push(index);
                        }
                        else {
                            let newExp = (expire - current + 1);
                            this.logger.pushDebug(JSON.stringify(jwToken), "auth");
                            this.cache.set(jwToken.id, jwToken.token, newExp);
                        }
                    });
                    removedIndexes.map(index => {
                        this.logger.pushDebug("Removing expired token " + data[keys[index]].token, "auth");
                        delete data[keys[index]];
                    });
                    this.logger.pushDebug(JSON.stringify(this.cache.values()), "auth");
                    this.localDb.push(this.storePath, data, true);
                }
                catch (e) {
                    this.logger.pushError(e, "auth");
                }
            }
        }
    }
    toMiddleware(): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let token = req.headers.token || req.header("token");
            if (!token) {
                let error = new BaseError(403, 403, "Forbidden", "Have no permission");
                res.status(error.code).json({
                    message: error.message,
                    status: error.name
                });
            }
            else {
                try {
                    let tempReq = <any>req;
                    let secret;
                    if(tempReq.systemSecret){
                        secret = tempReq.systemSecret;
                    }
                    let jwtObject = this.check(token as string, secret);
                    if(!tempReq.user){
                        tempReq.user = {};
                    }
                    tempReq.jwtData = {
                        idt: jwtObject.idt,
                        inf: jwtObject.inf
                    }
                    req = tempReq;
                    next();
                }
                catch (e) {
                    let error = new BaseError(400, 400, e.name, e.message);
                    res.status(error.code).json({
                        message: error.message,
                        status: error.name
                    });
                }
            }
        }
    }
}

export * from "@app/model/jwt.model";