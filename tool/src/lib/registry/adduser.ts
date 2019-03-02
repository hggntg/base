import childProcess from "child_process";
import { getConfig } from "../../infrastructure/utilities";

export function addUser(){
    let registry = getConfig("registry");
    childProcess.execSync("npm adduser --registry " + registry, {stdio: "inherit"});
}