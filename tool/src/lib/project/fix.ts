import { folders, folderLength } from "./internal";
import shell from "shelljs";
import sysPath from "path";
import fs from "fs";
import { tsconfig, typing, nodemon } from "./assets";
import { log } from "../../infrastructure/logger";

export function fix(scope: string){
    let cwd = process.cwd();
    let missingFiles = [];
    for (let i = 0; i < folderLength; i++) {
        let path = sysPath.join(cwd, folders[i]);
        if (!fs.existsSync(path)) {
            missingFiles.push(path);
        }
    }
    if(scope === "module"){
        shell.exec("npm install @types/node typescript nodemon ts-node -D", {silent: false});
    }
    missingFiles.map(missingFile => {
        if(missingFile.indexOf("tsconfig.json") > 0){
            fs.writeFileSync(sysPath.join(cwd, "tsconfig.json"), tsconfig);
        }
        else if(missingFile.indexOf("typings.d.ts") >= 0){
            fs.writeFileSync(sysPath.join(cwd, "typings.d.ts"), typing);
        }
        else if(missingFile.indexOf("nodemon.json") >= 0){
            fs.writeFileSync(sysPath.join(cwd, "nodemon.json"), nodemon);
        }
    });
    log("Your base project is fixed");
}