import path from "path";
import shell from "shelljs";
import fs from "fs";
import { getRootBasePath } from "../../infrastructure/utilities";

export function installModule(name: string){
    let storePath =getRootBasePath();
    let sourcePath = process.cwd();
    let modulePath = path.join(storePath, name);
    let packageJSONModule = fs.readFileSync(path.join(modulePath, "package.json")).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
    let packageObjectModule = JSON.parse(packageJSONModule);
    let moduleName = packageObjectModule.name;

    let moduleJSONSource = fs.readFileSync(path.join(sourcePath, "info.json")).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
    let moduleObjectSource = JSON.parse(moduleJSONSource);

    moduleObjectSource.dependencies[moduleName] = modulePath;

    fs.writeFileSync(path.join(sourcePath, "info.json"), JSON.stringify(moduleObjectSource, null, "\t"));
    shell.exec("npm install " + modulePath + " --save");
}