import jwt from "jsonwebtoken";
import LRU from "lru-cache";
import * as uuid from "uuid";
import { JwtObject, IJwToken, ITokenPair, IOutputToken, IJwtObject } from "@app/model/jwt.model";
import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import { createHash } from "crypto";
import express from "express";

const replacer = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
    "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f",
    "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v",
    "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
]
const equalSignToken = "Xx_Yy_Zz";
const slashSignToken = "jJ-Kk-Ll";
const crossSignToken = "Aa-bB_Cc";
const specialTokens = [
    "F.TOGEOOAQYDSZUWR", "XR.FNOGBLTCPWORPB", "JDA.VSNUDDDOPCTRJ", "TUBT.TBKMNVTPVMXO", "FWHVO.SRPBLZFOVQM", "MXQJCM.WNKPCMUIWH", "DRSUTFE.WNKZTHJKO", "RHRXAFDO.ZNQUUJWI",
    "BJUSZKSNO.JFOUKHN", "FBSVFMSMSK.ENQTVB", "EIGKZUHARPR.TBNUZ", "DQQDKSHAOPXK.QFRJ", "QUHRHIVISMKEL.MHS", "QUMQTHQKUNRNTW.TS", "WDCMZRAFGHFUMZF.G", "X.TQNWNGBWFEGCOXR",
    "HY.AMZEKNHLJTTGMV", "BQM.XEFIULFBELZSK", "TGVL.HZBKGUJPECZG", "XFZZT.ETUUYECUCXY", "XKMAJZ.XLATXEMETA", "ZJOYSDF.PHKOUKPRE", "VFRYVEOG.GNWRSGGI", "QLZWGPUVV.GMQBHBF",
    "RCYSPDUOLL.ZUBKYD", "TXOKHSHVXTF.TJSPE", "IQTFCMIWRNKK.IPEB", "XTFZEYBIQYOLW.YXT", "XSUGDIJNUHCESI.UI", "JQNUEGHOIRLPQIS.I", "W.RJXFJSAZZKORWJA", "FP.WQKUMWSNFBBTHB",
    "HJW.LJSIEHLJIGBYR", "WJFR.OXCEKRYNADBI", "CFKBE.WILLDVMWKLR", "RJSEEU.YQDFCXXTBF", "OMOVHTO.THRUBIEGF", "BBLEHFMN.ZJILMRLP", "GBBGYYDFN.PKYGPAX", "EBYSTWUCJU.BKUQQR",
    "HTMJDXYEVCP.WKJXE", "REGUNUHZFCAZ.GHOB", "BEDAHTYBRUEEX.FYF", "YRCQDBTXFVXRVF.DU", "XLRKTCBTJNFZTHY.S", "H.IUINDXYKZYXVBAB", "YV.MZOXARKNUXVOOB", "JSW.OWPALPTHLAVQQ",
    "TKPD.MGBYYPEPNCPP", "QTOFI.FQSLYCBBXOH", "NVGVDW.IXOGFJVPTB", "MBAZCGL.IQEQJQPAF", "MYVLDIIV.KCXJBMQQ", "OZQIRZRDP.PGGBGLT", "UCCMJZIAPY.SEJMKS", "KNCWHHZVFRA.AARHX",
    "NOSGBFECYLEI.TFXB", "WTGGIVGOSKKIK.XUG", "OONHQAWOKGMCUK.XB", "WIKVSCLAFBZUFDP.G", "W.ESZYBLFSOLQPGHX", "FV.ITCBQTMWSEXYIY", "COW.NXSSHCPQECEYR", "TTOY.JMIADDTZZUEI"
];
const specialTokenLength = specialTokens.length;

function encode(token: string) {
    let base64 = Buffer.from(token, "utf-8").toString("base64");
    let signTokenIndex = base64.indexOf("=");
    if (signTokenIndex < 0) signTokenIndex = base64.length - 1;
    else signTokenIndex -= 1;
    let lastToken = base64[signTokenIndex];
    let randomTokenIndex = replacer.indexOf(lastToken);
    let randomToken = specialTokens[randomTokenIndex];
    base64 = base64.replace(new RegExp(lastToken, "g"), randomToken);
    base64 = base64.replace(/=/g, equalSignToken);
    base64 = base64.replace(/\+/g, crossSignToken);
    base64 = base64.replace(/\//g, slashSignToken);
    return base64;
}

function decode(encodedToken: string) {
    let token = "";
    encodedToken = encodedToken.replace(new RegExp(slashSignToken, "g"), "/");
    encodedToken = encodedToken.replace(new RegExp(crossSignToken, "g"), "+");
    encodedToken = encodedToken.replace(new RegExp(equalSignToken, "g"), "=");
    for (let i = 0; i < specialTokenLength; i++) {
        if (encodedToken.match(new RegExp(specialTokens[i]))) {
            encodedToken = encodedToken.replace(new RegExp(specialTokens[i], "g"), replacer[i]);
            break;
        }
    }
    token = Buffer.from(encodedToken, "base64").toString("utf-8");
    return token;
}

function generateToken(inputKey) {
    let uid = uuid.v4();
    uid = Buffer.from(uid, "utf-8").toString("base64");
    let aLength = Math.floor(inputKey.length / 6);
    let kLength = uid.length / 6;
    let aMod = inputKey.length % 6;
    let total = 6;
    let token = "";

    for (let i = 0; i < total; i++) {
        let tempA = inputKey.substring(0, aMod + aLength);
        let tempK = uid.substring(0, kLength);
        inputKey = inputKey.slice(aMod + aLength);
        aMod = 0;
        uid = uid.slice(kLength);
        token += tempK + "x" + (tempA.length).toString(16) + "o" + tempA;
    }
    return token;
}

function resolveToken(token) {
    let realToken = "";
    let length = 8;
    for (let i = 0; i < 6; i++) {
        token = token.slice(length);
        let endHexIndex = token.indexOf("o") + 1;
        let hex = token.substring(0, endHexIndex);
        hex = hex.replace("x", "").replace("o", "");
        let segmentLength = parseInt(hex, 16);
        token = token.slice(endHexIndex);
        realToken += token.substring(0, segmentLength);
        token = token.slice(segmentLength);
    }
    return realToken;
}

export const MICRO_AUTH_SERVICE = "IMicroAuth";

interface IMicroAuth {
    storePath: string;
    dbPath: string;
    secret: string;
    autoRefresh: boolean;
    hasStore: boolean;
}

interface IMicroAuthMethod {
    create(info: JwtObject, options: jwt.SignOptions, secret?: string): IOutputToken;
    getByIDT(idt: string): string;
    check(token: string, secret?: string): JwtObject;
    read(privateToken: string, secret?: string): JwtObject;
    readOpt(privateToken: string, secret?: string): jwt.SignOptions;
    getPrivateToken(publicToken: string, secret?: string): string;
    toBlacklist(publicToken: string, secret?: string): boolean;
    toMiddleware(): (req: express.Request, res: express.Response, next: express.NextFunction) => void;
}

@Injectable(MICRO_AUTH_SERVICE, true)
export class MicroAuth implements IBaseClass<IMicroAuth>, IMicroAuthMethod {
    clone(): IMicroAuth {
        throw new Error("Method not implemented.");
    }
    toJSON(): string {
        throw new Error("Method not implemented.");
    }
    init(input: Partial<IMicroAuth>): void {
        if (!this.isInited) {
            this.isInited = true;
            this.secret = input.secret;
            if (input.hasStore === true || input.hasStore === false) this.hasStore = input.hasStore;
            if (input.autoRefresh === true || input.autoRefresh === false) this.autoRefresh = input.autoRefresh;
            if (this.hasStore) {
                this.storePath = input.storePath;
                this.localDb = new JsonDB(new Config(input.dbPath), true, true, "/");
                let that = this;
                this.cache = new LRU<string, ITokenPair>({
                    maxAge: 60 * 60 * 1000,
                    noDisposeOnSet: true,
                    updateAgeOnGet: this.autoRefresh,
                    dispose: function (key: string, value: ITokenPair) {
                        that.logger.pushInfo(`${key} ---- ${value.privateToken}`, "auth");
                        if (key && value) {
                            that.logger.pushInfo(`Removing token ${value.privateToken}`, "auth");
                            that.localDb.delete(`${that.storePath}/${key}`);
                            that.localDb.save();
                        }
                    }
                });
                try {
                    this.logger.pushInfo("Restoring tokens in store", "auth");
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
                    this.logger.pushInfo(JSON.stringify(data), "auth");
                    Object.values(data).map((jwToken: IJwToken, index) => {
                        let expire = jwToken.exp;
                        if (expire <= current) {
                            removedIndexes.push(index);
                        }
                        else {
                            let newExp = (expire - current + 1);
                            this.logger.pushInfo(JSON.stringify(jwToken), "auth");
                            this.cache.set(jwToken.id, { privateToken: jwToken.privateToken, publicToken: jwToken.publicToken, secret: jwToken.secret, options: jwToken.options, info: jwToken.info }, newExp);
                        }
                    });
                    removedIndexes.map(index => {
                        this.logger.pushInfo("Removing expired token " + data[keys[index]].privateToken, "auth");
                        delete data[keys[index]];
                    });
                    this.logger.pushInfo(JSON.stringify(this.cache.values()), "auth");
                    this.localDb.push(this.storePath, data, true);
                }
                catch (e) {
                    this.logger.pushError(e, "auth");
                }
            }
        }
    }
    private localDb: JsonDB;
    private storePath: string;
    private cache: LRU<string, ITokenPair>;
    private logger: ILogger = getDependency<ILogger>(LOGGER_SERVICE);
    private secret: string;
    private isInited: boolean = false;
    private autoRefresh: boolean = true;
    private hasStore: boolean = false;
    create(info: JwtObject, options: jwt.SignOptions, secret?: string): IOutputToken {
        let expiresIn: number = options.expiresIn as number;
        if (info.exp) {
            expiresIn = (+new Date(info.exp * 1000) - +Date.now()) / 1000;
            options.expiresIn = Math.floor(expiresIn);
            delete info.exp;
            delete info.iat;
        };
        let idt: string = createHash("sha256").update(info.idt).digest("hex");
        let privateToken: string;
        let publicToken: string;
        if (this.hasStore) {
            let tokenPair = this.cache.get(idt);
            if (!tokenPair) {
                info.opt = Buffer.from(JSON.stringify(options), "utf-8").toString("base64");
                if (info.pub) publicToken = info.pub;
                else {
                    publicToken = generateToken(encode(idt));
                    info.pub = publicToken;
                }
                privateToken = jwt.sign(info, secret || this.secret, options);
                this.logger.pushInfo(`Create token ${privateToken}`, "auth");

                let cacheMaxAge = expiresIn * 1000;
                this.cache.set(idt, { privateToken: privateToken, publicToken: publicToken, secret: secret ||this.secret, options: options, info: info }, cacheMaxAge);

                let exp = +Date.now() + expiresIn * 1000;
                let jwToken: IJwToken = { id: idt, privateToken: privateToken, publicToken: publicToken, exp: exp, secret: secret || this.secret, options: options, info: info };

                this.localDb.push(this.storePath + "/" + jwToken.id, jwToken);
            }
            else {
                privateToken = tokenPair.privateToken;
                publicToken = tokenPair.publicToken;
                if(this.autoRefresh){
                    let jwToken: IJwToken = this.localDb.getData(this.storePath + "/" + idt);

                    let innerInfo = this.read(privateToken);
                    let innerOptions: jwt.SignOptions = JSON.parse(Buffer.from(innerInfo.opt, "base64").toString("utf-8"));
                    let innerExpiresIn = innerOptions.expiresIn as number;

                    let timeLeft = +Date.now() - innerInfo.exp * 1000;
                    let rateTimeLeft = (timeLeft / innerExpiresIn) * 100;
                    if(rateTimeLeft <= 50){
                        delete innerInfo.exp;
                        delete innerInfo.iat;

                        privateToken = jwt.sign(innerInfo, secret || this.secret, innerOptions);
                        jwToken.privateToken = privateToken;
                        tokenPair.privateToken = privateToken;
                        
                        let cacheMaxAge = innerExpiresIn * 1000;
                        this.cache.set(idt, tokenPair, cacheMaxAge);
                    }

                    let exp = +Date.now() + innerExpiresIn * 1000;
                    jwToken.exp = exp;
                    this.localDb.push(this.storePath + "/" + jwToken.id, jwToken);
                }
            }
        }
        else {
            privateToken = jwt.sign(info, secret || this.secret, options);
            publicToken = info.pub;
        }
        return {
            privateToken: privateToken,
            publicToken: publicToken
        }
    }
    getByIDT(idt: string): string {
        if (this.hasStore) {
            idt = createHash("sha256").update(idt).digest("hex");
            let cachedTokenPair = this.cache.get(idt);
            if (cachedTokenPair) {
                if(this.autoRefresh){
                    let info: IJwtObject;
                    let jwToken: IJwToken = this.localDb.getData(this.storePath + "/" + idt);
                        
                    let options: jwt.SignOptions = jwToken.options;
                    let expiresIn = options.expiresIn as number;
                    
                    try {
                        info = this.read(cachedTokenPair.privateToken, cachedTokenPair.secret);
                    }
                    catch(e){
                        let privateToken = jwt.sign(info, cachedTokenPair.secret, options);
                        info = this.read(privateToken, cachedTokenPair.secret);
                    }

                    let timeLeft = +Date.now() - info.exp * 1000;
                    let rateTimeLeft = (timeLeft / expiresIn) * 100;

                    if(rateTimeLeft <= 50){
                        delete info.exp;
                        delete info.iat;

                        let privateToken = jwt.sign(info, cachedTokenPair.secret, options);
                        jwToken.privateToken = privateToken;
                        cachedTokenPair.privateToken = privateToken;

                        let cacheMaxAge = expiresIn * 1000;
                        this.cache.set(idt, cachedTokenPair, cacheMaxAge);
                    }

                    let exp = +Date.now() + expiresIn * 1000;
                    jwToken.exp = exp;
                    this.localDb.push(this.storePath + "/" + jwToken.id, jwToken)
                }
                return cachedTokenPair.publicToken;
            }
            else {
                throw new Error("Token is expired");
            }
        }
        else {
            throw new Error("No token store");
        }
    }
    getPrivateToken(publicToken: string, secret?: string): string {
        try{
            if (this.hasStore) {
                let token = resolveToken(publicToken);
                let idt = decode(token);
                let cachedTokenPair = this.cache.get(idt);
                if (cachedTokenPair) {
                    if(this.autoRefresh){
                        let info: IJwtObject;
                        let jwToken: IJwToken = this.localDb.getData(this.storePath + "/" + idt);

                        let options: jwt.SignOptions = jwToken.options;
                        let expiresIn = options.expiresIn as number;
                        
                        try {
                            info = this.read(cachedTokenPair.privateToken, cachedTokenPair.secret);
                        }
                        catch(e){
                            let privateToken = jwt.sign(info, cachedTokenPair.secret, options);
                            info = this.read(privateToken, cachedTokenPair.secret);
                        }
    

                        let timeLeft = +Date.now() - info.exp * 1000;
                        let rateTimeLeft = (timeLeft / expiresIn) * 100;

                        if(rateTimeLeft <= 50){
                            delete info.exp;
                            delete info.iat;
    
                            let privateToken = jwt.sign(info, cachedTokenPair.secret, options);
                            jwToken.privateToken = privateToken;
                            cachedTokenPair.privateToken = privateToken;

                            let cacheMaxAge = expiresIn * 1000;
                            this.cache.set(idt, cachedTokenPair, cacheMaxAge);
                        }

                        let exp = +Date.now() + expiresIn * 1000;
                        jwToken.exp = exp;
                        this.localDb.push(this.storePath + "/" + jwToken.id, jwToken);
                    }
                    return cachedTokenPair.privateToken;
                }
                else {
                    throw new Error("Token is expired");
                }
            }
            else {
                throw new Error("No token store");
            }
        }
        catch(e){
            throw e;
        }
    }
    check(token: string, secret?: string): JwtObject {
        try {
            if (this.hasStore) {
                token = resolveToken(token);
                let idt = decode(token);
                let cachedTokenPair = this.cache.get(idt);
                if (cachedTokenPair) {
                    let info: IJwtObject;
                    if(this.autoRefresh){
                        let jwToken: IJwToken = this.localDb.getData(this.storePath + "/" + idt);
                        
                        let options: jwt.SignOptions = jwToken.options;
                        let expiresIn = options.expiresIn as number;
                        
                        try {
                            info = this.read(cachedTokenPair.privateToken, cachedTokenPair.secret);
                        }
                        catch(e){
                            let privateToken = jwt.sign(info, cachedTokenPair.secret, options);
                            info = this.read(privateToken, cachedTokenPair.secret);
                        }

                        let timeLeft = +Date.now() - info.exp * 1000;
                        let rateTimeLeft = (timeLeft / expiresIn) * 100;

                        if(rateTimeLeft <= 50){
                            delete info.exp;
                            delete info.iat;
                            
                            let privateToken = jwt.sign(info, cachedTokenPair.secret, options);
                            jwToken.privateToken = privateToken;
                            cachedTokenPair.privateToken = privateToken;

                            let cacheMaxAge = expiresIn * 1000;
                            this.cache.set(idt, cachedTokenPair, cacheMaxAge);
                        }

                        let exp = +Date.now() + expiresIn * 1000;
                        jwToken.exp = exp;
                        this.localDb.push(this.storePath + "/" + jwToken.id, jwToken);
                    }
                    return info;
                }
                else {
                    return null;
                }
            }
            else {
                return this.read(token);
            }
        }
        catch (e) {
            throw e;
        }
    }
    read(privateToken: string, secret?: string): JwtObject {
        try {
            let decodedObject = jwt.verify(privateToken, secret || this.secret) as JwtObject;
            return decodedObject;
        }
        catch (e) {
            throw e;
        }
    }
    readOpt(privateToken: string, secret?: string): jwt.SignOptions {
        try {
            let jwtObject = this.read(privateToken, secret);
            let opt = Buffer.from(jwtObject.opt, "base64").toString("utf-8");
            return JSON.parse(opt) as jwt.SignOptions;
        }
        catch (e) {
            throw e;
        }
    }
    toBlacklist(publicToken: string, secret?: string): boolean {
        if (this.hasStore) {
            try {
                let jwtObject = this.check(publicToken, secret);
                if (jwtObject) {
                    let realPublicToken = createHash("sha256").update(jwtObject.idt).digest("hex");
                    this.cache.del(realPublicToken);
                    return true;
                }
                else {
                    let errorString = `Token ${publicToken} is invalid`;
                    throw new Error(errorString);
                }
            }
            catch (e) {
                let errorString = "";
                if (e instanceof jwt.TokenExpiredError) {
                    errorString += `Token ${publicToken} is expired`;
                }
                else if (e instanceof jwt.JsonWebTokenError) {
                    errorString += `Token ${publicToken} is invalid`;
                }
                else if (e instanceof jwt.NotBeforeError) {
                    errorString += `Token ${publicToken} is not active`;
                }
                else {
                    errorString += `${e.message}`;
                }
                throw new Error(errorString);
            }
        }
        else {
            throw new Error("No token store");
        }
    }
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    toMiddleware(): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let token = req.headers.token || req.header("token");
            if (!token) {
                let error = new BaseError(403, 403, "Have no permission");
                res.status(error.code).json({
                    code: error.code,
                    message: error.message,
                    status: error.name
                });
            }
            else {
                try {
                    let tempReq = <any>req;
                    let secret;
                    if (tempReq.systemSecret) {
                        secret = tempReq.systemSecret;
                    }
                    let jwtObject = this.check(token as string, secret);
                    if (!tempReq.user) {
                        tempReq.user = {};
                    }
                    if (jwtObject) {
                        tempReq.jwtData = {
                            idt: jwtObject.idt,
                            inf: jwtObject.inf
                        }
                        req = tempReq;
                        next();
                    }
                    else {
                        let error = new BaseError(401, 401, "Token Invalid");
                        res.status(error.code).json({
                            code: error.code,
                            message: error.message,
                            status: error.name
                        });
                    }
                }
                catch (e) {
                    console.error(e);
                    let error = new BaseError(400, 400, e.message);
                    res.status(error.code).json({
                        code: error.code,
                        message: error.message,
                        status: error.name
                    });
                }
            }
        }
    }
}

export * from "@app/model/jwt.model";