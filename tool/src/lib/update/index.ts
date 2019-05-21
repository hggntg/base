import path from "path";
import fs from "fs";
import shell from "shelljs";
import { CommanderStatic } from "commander";

declare const commander : CommanderStatic;

(function(){
    commander.command("update")
    .description("update plugins and interfaces for base project")
    .action(() => {
        let sourcePath = process.cwd();
        let packagePath = path.join(sourcePath, "package.json");
        if(fs.existsSync(packagePath)){
            let packageJSONModule = fs.readFileSync(packagePath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
            let packageObjectModule = JSON.parse(packageJSONModule);
            if(packageObjectModule.baseDependencies){
                if(Array.isArray(packageObjectModule.baseDependencies) && packageObjectModule.baseDependencies.length > 0){
                    let modules = packageObjectModule.baseDependencies.join(" ");
                    let result = shell.exec(`npm update ${modules}`);
                    if(result.code !== 0){
                        throw new Error(result.stderr);
                    }
                }
            }
        }
        else{
            throw new Error("Cannot update base plugins and interfaces outside base project");
        }
    });
})();