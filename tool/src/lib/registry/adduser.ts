import childProcess from "child_process";
import { getConfig } from "../../infrastructure/utilities";

export function addUser(scope: string){
    let registry = getConfig("registry");
    childProcess.execSync("npm adduser --registry " + registry[scope], {stdio: "inherit"});
}