import { spawnSync, SpawnSyncReturns } from "child_process";
import { join } from "path";

let count = 10;

for(let i = 0; i < count; i++){
    let result = null;
    if (i % 2 === 0) {
        result = spawnSync("node", [join(__dirname, "worker.js")]);
    }
    else {
        result = spawnSync("node", [join(__dirname, "worker.js"), "--params=a,b,c,d,e"], { timeout: 500 });
    }
    try{
        let value = processResultFromChildProcess(result);
        console.log(value);
    }
    catch(e){
        console.error(e);
    }
}
process.exit();

function processResultFromChildProcess<T = any>(returnResult: SpawnSyncReturns<string>): T {
    if (returnResult.status === 0) {
        let hasError = returnResult.stderr && returnResult.stderr.length > 0;
        if (hasError) {
            let errorString = returnResult.stderr.toString();
            try {
                let errorObject = JSON.parse(errorString);
                let err: Error = new Error()
                err.name = errorObject.name;
                err.message = errorObject.message;
                throw err.stack;
            }
            catch (e) {
                throw e;
            }
        }
        else {
            try {
                let resultObject = JSON.parse(returnResult.stdout.toString());
                return resultObject as T;
            }
            catch (e) {
                throw e;
            }
        }
    }
    else {
        if (returnResult.error) {
            if(returnResult.error["code"] && returnResult.error["code"] === "ETIMEDOUT"){
                throw new Error("Timeout for executing task");
            }
            throw returnResult.error;
        }
        return null;
    }
}