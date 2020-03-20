import path from "path";
import shell from "shelljs";
import fs from "fs";
import { log } from "../../infrastructure/logger";

export function installCore(name: string, type: string = "main"){
    if(!name){
        throw new Error("Missing core name");
    }
    let sourcePath = process.cwd();
    let packagePath = path.join(sourcePath, "package.json");
    if(fs.existsSync(packagePath)){
        let packageJSONModule = fs.readFileSync(packagePath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
        let packageObjectModule = JSON.parse(packageJSONModule);
        if(!packageObjectModule["baseDependencies"]){
            packageObjectModule["baseDependencies"] = [];
            fs.writeFileSync(packagePath, JSON.stringify(packageObjectModule, null, "\t"));
        }
        let coreName = `@base/${name}`
        if(!packageObjectModule["baseDependencies"].includes(coreName)){
            shell.exec(`npm info ${coreName}`, function(code, stdout, stderr){
                if(code === 0){
                    let installOption = type === "dev" ? " -D" : "";
                    log(`npm install ${coreName}${installOption}`);
                    shell.exec(`npm install ${coreName}${installOption}`, function(code, stdout, stderr){
                        if(code === 0){
                            packageJSONModule = fs.readFileSync(packagePath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
                            packageObjectModule = JSON.parse(packageJSONModule);
                            packageObjectModule["baseDependencies"].push(coreName);
                            fs.writeFileSync(packagePath, JSON.stringify(packageObjectModule, null, "\t"));
                        }
                        else{
                            throw new Error("Cannot install core");
                        }
                    });
                }
                else{
                    throw new Error("Core is not found");
                }
            });
        }
        else{
            console.warn("Core has been installed. please use update to upgrade your core");
        }   
    }
    else{
        throw new Error("Cannot install base core outside base project");
    }
}