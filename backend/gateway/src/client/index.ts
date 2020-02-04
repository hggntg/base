import { IServiceRegistrySection, IServiceRegistryAPIBody } from "@app/infrastructure/model";

import http, { IncomingMessage } from "http";
import https from "https";

const httpList = { http: http, https: https }; 

let retryTimes = 0;
const maxRetryTimes = 20;
const delayTime = 500;

function generateSecondMessage(timestamp: number): string{
    let inSecond = 0;
    let inMilisecond = timestamp;
    if(timestamp >= 1000){
        inSecond = Math.floor(inMilisecond / 1000);
        inMilisecond = inMilisecond - inSecond * 1000;
    }
    let messages: string[] = [];
    if(inSecond){
        messages.push(`${inSecond}s`);
        if(inMilisecond){
            messages.push(`${inMilisecond}ms`);
        }
    }
    else {
        if(inMilisecond){
            messages.push(`${inMilisecond}ms`);
        }
    }
    return messages.join(" ");
}

function retry(serviceRegistrySection: IServiceRegistrySection){
    retryTimes += 1;
    if(retryTimes > maxRetryTimes){
        retryTimes = 1;
    }
    let timeToRetry = retryTimes * delayTime;
    console.log(`Retry to register to api gateway in ${generateSecondMessage(timeToRetry)}`);
    setTimeout(() => {
        register(serviceRegistrySection);
    }, timeToRetry);
}

export function register(serviceRegistrySection: IServiceRegistrySection){
    let serviceRegistry: IServiceRegistryAPIBody = Object.noMap<IServiceRegistryAPIBody>(serviceRegistrySection);
    let scheme = serviceRegistry.scheme;
    let host = scheme + "://" + serviceRegistry.hostname;
    let registerApi = serviceRegistry.apis.register;
    let endpoint = host + "/" + registerApi.path;
    let httpCall = httpList[scheme];
    if(!serviceRegistry.publicKey){
        throw new Error("Missing client public key");
    }
    if(!serviceRegistry.id && !serviceRegistry.secret){
        throw new Error("Missing client id or client secret");
    }
    let request = httpCall.request(endpoint, {
        headers: {
            "Content-Type": "application/json",
            "X-Key": serviceRegistry.publicKey,
            "X-Identifier": (`${serviceRegistry.id}:${serviceRegistry.secret}`)
        },
        method: registerApi.method
    }, (response: IncomingMessage) => {
        let resultString = "";
        response.on("data", (chunk: Buffer) => {
            resultString += chunk.toString();
        }).once("end", () => {
            try{
                let resultObject = JSON.parse(resultString);
                if(response.statusCode >= 200 && response.statusCode < 400){
                    console.log("Register to api gateway successfully");
                }
                else {
                    console.error("Register to api gateway failed cause " + resultObject.message);
                    retry(serviceRegistrySection);
                }
            }
            catch(e){
                console.error(e.message);
                console.log(resultString);
                retry(serviceRegistrySection);
            }
        });
    });
    request.on("error", (err) => {
        console.error(err);
        retry(serviceRegistrySection); 
    }).end(JSON.stringify(registerApi.body));
}