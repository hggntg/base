import path from "path";
import fs from "fs";
import shell from "shelljs";
import { getRootBasePath } from "../../infrastructure/utilities";
import rimraf from "rimraf";

export function buildModule(name){
    let storePath = getRootBasePath();
    let sourcePath = process.cwd();
    let destPath = path.join(storePath, name);

    if(fs.existsSync(destPath)){
        rimraf.sync(destPath);
    }
    fs.mkdirSync(destPath);
    
    shell.exec("npm version patch");
    shell.cp("-R", path.join(sourcePath, "package.json"), path.join(destPath, "package.json"));
    
    let output = shell.exec("tsc --outDir " + destPath);
    if(output.stderr){
        console.error(output.stderr);
    }
    else{
        console.log(output.stdout);
    }
}