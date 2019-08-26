import path from "path";
import shell from "shelljs";
import fs from "fs";
import { log } from "../../infrastructure/logger";

export function installInterface(name: string, type: string = "main"){
    if(!name){
        throw new Error("Missing interface name");
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
        let interfaceName = `@base-interfaces/${name}`
        if(!packageObjectModule["baseDependencies"].includes(interfaceName)){
            shell.exec(`npm info ${interfaceName}`, function(code, stdout, stderr){
                if(code === 0){
                    let installOption = type === "dev" ? "--save-dev" : "--save-prod";
                    log(`npm install ${interfaceName} ${installOption}`);
                    shell.exec(`npm install ${interfaceName} ${installOption}`, function(code, stdout, stderr){
                        if(code === 0){
                            packageJSONModule = fs.readFileSync(packagePath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
                            packageObjectModule = JSON.parse(packageJSONModule);
                            packageObjectModule["baseDependencies"].push(interfaceName);
                            fs.writeFileSync(packagePath, JSON.stringify(packageObjectModule, null, "\t"));
                        }
                        else{
                            throw new Error("Cannot install interface");
                        }
                    });
                }
                else{
                    throw new Error("Interface is not found");
                }
            });
        }
        else{
            console.warn("Interface has been installed. please use update to upgrade your interface");
        }   
    }
    else{
        throw new Error("Cannot install base interface outside base project");
    }
}