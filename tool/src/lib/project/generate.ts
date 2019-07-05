import { mainEventSource } from "./lib/compiler";
import { folderLength, folders } from "./internal";
import fs from "fs";
import sysPath from "path";

export function generate(live?: "live"){
    let cwd = process.cwd();
    let isValid = true;
    for (let i = 0; i < folderLength; i++) {
        let path = sysPath.join(cwd, folders[i]);
        if (!fs.existsSync(path)) {
            isValid = false;
            break;
        }
    }
    if (isValid) {
        let isLive = live ? true : false;
        mainEventSource.emit("start", cwd, false, isLive);
    }
    else {
        throw new Error("You must be stay in your base project folder");
    }
}