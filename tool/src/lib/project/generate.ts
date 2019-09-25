import { mainEventSource } from "./lib/compiler";
import { folderLength, folders } from "./internal";
import fs from "fs";
import sysPath from "path";

export function generate(live?: "live", target?: string, tsconfig?: string){
    let cwd = process.cwd();
    if(!target) target = "root";

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
        mainEventSource.emit("start", cwd, false, isLive, target, tsconfig);
        mainEventSource.once("end", () => {
            let hooksFolder = sysPath.join(cwd, "hooks", target);
            if(fs.existsSync(hooksFolder)){
                let generatedHooksFolder = sysPath.join(cwd, ".generated", target, "hooks");
                if(!fs.existsSync(generatedHooksFolder)) fs.mkdirSync(generatedHooksFolder);
                let files = fs.readdirSync(hooksFolder);
                files.map(file => {
                    let generatedHookFile = sysPath.join(generatedHooksFolder, file);
                    fs.copyFileSync(sysPath.join(hooksFolder, file), generatedHookFile);
                });
            }
            process.exit(0);
        });
    }
    else {
        throw new Error("You must be stay in your base project folder");
    }
}