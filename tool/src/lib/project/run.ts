import fs from "fs";
import sysPath from "path";
import { mainEventSource } from "./lib/compiler";
import { folders, folderLength } from "./internal";
export function run(target?: string, tsconfig?: string) {
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
        mainEventSource.emit("start", cwd, true, true, target, tsconfig);
    }
    else {
        throw new Error("You must be stay in your base project folder");
    }
}