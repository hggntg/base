import path from "path";
import fs from "fs";
import shell from "shelljs";
import { getRootBasePath } from "../../infrastructure/utilities";
import rimraf from "rimraf";

export function buildModule(name){
    let storePath = getRootBasePath();
    let sourcePath = process.cwd();
    let destPath = path.join(storePath, name)
    if(fs.existsSync(destPath)){
        rimraf.sync(destPath);
    }
    fs.mkdirSync(destPath);

    shell.cp("-R", path.join(sourcePath, "package.json"), path.join(destPath, "package.json"));
    
    shell.exec("tsc --outDir " + destPath);
}