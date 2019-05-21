import { CommanderStatic } from "commander";
import shell from "shelljs";
import fs from "fs";
import path from "path";

declare const commander : CommanderStatic;

(function(){
    commander.command("set <key> <value1> [value2]")
    .description("install module")
    .action((key: string, value1: string, value2: string) => {
        let toolPath = path.join(__dirname, "../tool.json");
        if(!fs.existsSync(toolPath)){
            fs.writeFileSync(toolPath, "{}");
        }
        let configJSON = fs.readFileSync(toolPath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
        let config = JSON.parse(configJSON);
        
        if(key === "registry"){
            if(value2){
                if(!config[key]) config[key] = {};
                config[key][value1] = value2;
                shell.exec(`npm set @${value1}:registry ${value2}`);
            }
        }
        else{
            if(value2){
                if(!config[key]) config[key] = {};
                config[key][value1] = value2;
            }
            else{
                config[key] = value1;
            }
        }
        fs.writeFileSync(toolPath, JSON.stringify(config, null, "\t"));
    });
})();