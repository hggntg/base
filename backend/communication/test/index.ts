import { Logger } from "@base/logger";
import { Communication, RPCResult, IRPCResult } from "../src";
const logger = new Logger();
logger.initValue({
    appName: "test"
})
logger.trace(true);
const com = new Communication("amqp://guest:guest@localhost:5672", logger);

interface Category {
    name: string;
    __v: number;
    id: string;
    childs: Array<Category>;
}

com.connect().then(() => {
    // const client = com.createClient("");
    // client.setOptionForRPCCall(5000, 12);
    // let count = 0;

    const owner = com.createOwner();

    // let interval = setInterval(() => {
    //     if(count === 10){
    //         clearInterval(interval);
    //     }
    //     else{
    //         for(let i = 0; i < 20; i++){
    //             var num = Math.floor(Math.random() * 10 + 1);
    //             let eventName = client.rpcCall("real-test-rpc", num.toString());
    //             client.waitForResult(eventName).catch(err => {
    //                 logger.pushError(err.message, "");
    //             });   
    //         }
    //         count++;
    //     }
    // }, 1);
    for (let i = 0; i < 5; i++) {
        var num = Math.floor(Math.random() * 10 + 1);
        owner.pushJob("test-worker", {
            method: "category.getCategories",
            args: [],
            priority: 1
        });
        // let eventName = client.rpcCall("real-test-rpc", {
        //     method: "category.getCategories",
        //     args: [Math.floor(i / 20) + 1],
        //     hasCallback: true
        // }, { retry: 3, timeout: 5000 });
        // client.waitForResult(eventName).then((data: IRPCResult<Category>) => {
        //     if(data.status >= 200 && data.status < 400){
        //         let rpcResult = new RPCResult(data);
        //         let result = rpcResult.result().list();
        //         result.content.map(value => {});
        //         logger.pushDebug(JSON.stringify(result) + "", "Rabbitmq(Client)");
        //     }
        //     else{
        //         logger.pushError(data.message, "");
        //     }
        // }).catch((err: Error) => {
        //     logger.pushError(err, "");
        // });
    }
});