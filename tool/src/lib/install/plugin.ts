import path from "path";
import shell from "shelljs";
import fs from "fs";
import { log } from "../../infrastructure/logger";

export function installPlugin(name: string, type: string = "main"){
    if(!name){
        throw new Error("Missing plugin name");
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
        let pluginName = `@base-plugins/${name}`
        if(!packageObjectModule["baseDependencies"].includes(pluginName)){
            shell.exec(`npm info ${pluginName} `, function(code, stdout, stderr){
                if(code === 0){
                    let installOption = type === "dev" ? "--save-dev" : "--save-prod";
                    log(`npm install ${pluginName} ${installOption}`);
                    shell.exec(`npm install ${pluginName} ${installOption}`, function(code, stdout, stderr){
                        if(code === 0){
                            packageJSONModule = fs.readFileSync(packagePath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
                            packageObjectModule = JSON.parse(packageJSONModule);
                            packageObjectModule["baseDependencies"].push(pluginName);
                            fs.writeFileSync(packagePath, JSON.stringify(packageObjectModule, null, "\t"));
                        }
                        else{
                            throw new Error("Cannot install plugin");
                        }
                    });
                }
                else{
                    throw new Error("Plugin is not found");
                }
            });
        }
        else{
            console.warn("Plugin has been installed. please use update to upgrade your plugin");
        }   
    }
    else{
        throw new Error("Cannot install base plugin outside base project");
    }
}