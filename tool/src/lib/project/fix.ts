import { folders, folderLength } from "./internal";
import shell from "shelljs";
import sysPath from "path";
import fs from "fs";
import { log } from "../../infrastructure/logger";

export function fix(){
    let cwd = process.cwd();
    let missingFiles = [];
    for (let i = 0; i < folderLength; i++) {
        let path = sysPath.join(cwd, folders[i]);
        if (!fs.existsSync(path)) {
            missingFiles.push(path);
        }
    }
    let samplePath = sysPath.join(__dirname, "../../sample");
    shell.exec("npm install @types/node inversify reflect-metadata -D", {silent: false});
    missingFiles.map(missingFile => {
        if(missingFile.indexOf("tsconfig.json") > 0){
            fs.copyFileSync(sysPath.join(samplePath, "tsconfig.json"), sysPath.join(cwd, "tsconfig.json"));
        }
        else if(missingFile.indexOf("typings.d.ts") >= 0){
            fs.copyFileSync(sysPath.join(samplePath, "typings.d.ts"), sysPath.join(cwd, "typings.d.ts"));
        }
    });
    log("Your base project is fixed");
}