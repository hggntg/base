import mongoose from "mongoose";
import crypto from "crypto";
import redis from "redis";

export interface ICache {
    createConnection(options: {
        host: string,
        port: number,
        password: string
    }): Promise<void>;
    init(dbname: string, collections: string[]): Promise<boolean>;
    exists(dbname: string, collection: string, query: mongoose.Query<any>): boolean;
    get(dbname: string, collection: string, query: mongoose.Query<any>): Promise<any>;
    set(dbname: string, collection: string, query: mongoose.Query<any>, value: any): boolean;
    clear(dbname: string, collection: string): boolean;
    clearAll(force?: boolean): boolean;
    setMaybeClear(dbname: string, collection: string);
}

export class Cache implements ICache {
    private static client: redis.RedisClient;
    private static maybeClearedList: string[] = [];
    private static queryHashList: {
        [key: string]: string[];
    } = {};
    private static hasConnection: boolean = false;
    createConnection(options: {
        host: string,
        port: number,
        password: string
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            if(!Cache.client){
                Cache.client = redis.createClient(options);
                Cache.client.on("error", function(error) {
                    let e = handleError(new BaseError(error));
                    if(error.code === "ECONNREFUSED"){
                        Cache.hasConnection = false;
                        Cache.client.quit();
                        Cache.client = undefined;
                        if(reject && typeof reject === "function") reject(e);
                    }
                });
            }
            Cache.client.once("ready", () => {
                Cache.hasConnection = true;
                resolve();
            });
        })
    }
    init(dbname: string, collections: string[]): Promise<boolean>{
        if(!Cache.hasConnection){
            console.warn("WARNING: Use redis cache but has no connection. Please check the connection to redis server");
            return Promise.resolve(true);
        }
        let promiseList = [];
        collections.map(collection => {
            let collectionName = dbname + "|" + collection;
            let collectionHash = crypto.createHash("md5").update(collectionName).digest("hex");
            promiseList.push(new Promise((resolve, reject) => {
                Cache.client.hscan(collectionHash, ["0", "COUNT", "1000"], (err, replies) => {
                    if(err) reject(err);
                    else {
                        let values = replies[1];
                        let keys = [];
                        values.map((reply, index) => {
                            if(index % 2 === 0){
                                keys.push(reply);
                            }
                        });     
                        if(keys.length > 0)  resolve(Cache.client.hdel(collectionHash, keys));
                        else resolve(true);
                    }
                });
            }));
        });
        return Promise.all(promiseList).then(() => true).catch(e => false);
    }
    exists(dbname: string, collection: string, query: mongoose.Query<any>): boolean {
        if(!Cache.hasConnection){
            console.warn("WARNING: Use redis cache but has no connection. Please check the connection to redis server");
            return true;
        }
        let collectionName = dbname + "|" + collection;
        let queryToken = {
            ...query.getQuery(),
            ...query.getOptions()
        }
        let queryString = JSON.stringify(queryToken);
        let collectionHash = crypto.createHash("md5").update(collectionName).digest("hex");
        let queryHash = crypto.createHash("md5").update(queryString).digest("hex");
        return Cache.client.hexists(collectionHash, queryHash);
    }
    get(dbname: string, collection: string, query: mongoose.Query<any>): Promise<any> {
        if(!Cache.hasConnection){
            console.warn("WARNING: Use redis cache but has no connection. Please check the connection to redis server");
            return Promise.resolve();
        }
        let collectionName = dbname + "|" + collection;
        let queryToken = {
            ...query.getQuery(),
            ...query.getOptions()
        }
        let queryString = JSON.stringify(queryToken);
        let collectionHash = crypto.createHash("md5").update(collectionName).digest("hex");
        let queryHash = crypto.createHash("md5").update(queryString).digest("hex");
        return new Promise((resolve, reject) => {
            Cache.client.hget(collectionHash, queryHash, (err, value) => {
                if(err) reject(err);
                else resolve(JSON.parse(value));
            });
        });
    }
    set(dbname: string, collection: string, query: mongoose.Query<any>, value: any){
        if(!Cache.hasConnection){
            console.warn("WARNING: Use redis cache but has no connection. Please check the connection to redis server");
            return true;
        }
        let collectionName = dbname + "|" + collection;
        let queryToken = {
            ...query.getQuery(),
            ...query.getOptions()
        }
        let queryString = JSON.stringify(queryToken);
        let collectionHash = crypto.createHash("md5").update(collectionName).digest("hex");
        let queryHash = crypto.createHash("md5").update(queryString).digest("hex");
        if(!Cache.queryHashList[collectionHash]) Cache.queryHashList[collectionHash] = [];
        Cache.queryHashList[collectionHash].push(queryHash);
        return Cache.client.hset(collectionHash, queryHash, JSON.stringify(value));
    }
    clear(dbname: string, collection: string){
        if(!Cache.hasConnection){
            console.warn("WARNING: Use redis cache but has no connection. Please check the connection to redis server");
            return true;
        }
        let collectionName = dbname + "|" + collection;
        let collectionHash = crypto.createHash("md5").update(collectionName).digest("hex");
        let index = Cache.maybeClearedList.indexOf(collectionHash);
        if(index >= 0) {
            Cache.maybeClearedList.splice(index, 0);
        }
        let keys = Cache.queryHashList[collectionHash];
        if(keys){
            delete Cache.queryHashList[collectionHash];
            if(keys.length > 0){
                return Cache.client.hdel(collectionHash, keys)
            }
            return true;
        }
        return true;
    }
    clearAll() {
        if(!Cache.hasConnection){
            console.warn("WARNING: Use redis cache but has no connection. Please check the connection to redis server");
            return true;
        }
        let status = 1;
        Cache.maybeClearedList.map(collectionHash => {
            let keys = Cache.queryHashList[collectionHash];
            delete Cache.queryHashList[collectionHash];
            if(keys){
                if(keys.length > 0) status *= Cache.client.hdel(collectionHash, keys) ? 1 : 0;
                status *= 1;
            }
        });
        Cache.maybeClearedList = [];
        return status ? true : false;
    }
    setMaybeClear(dbname: string, collection: string){
        if(!Cache.hasConnection){
            console.warn("WARNING: Use redis cache but has no connection. Please check the connection to redis server");
        }
        else {
            let collectionName = dbname + "|" + collection;
            let collectionHash = crypto.createHash("md5").update(collectionName).digest("hex");
            if(!Cache.maybeClearedList.includes(collectionHash)) Cache.maybeClearedList.push(collectionHash);
        }
    }
    constructor(){

    }
}