import { CommanderStatic } from "commander";
import shell from "shelljs";
import fs from "fs";
import path from "path";

declare const commander : CommanderStatic;

(function(){
    commander.command("set <key> <value>")
    .description("install module")
    .action((key: string, value: string) => {
        let toolPath = path.join(__dirname, "../tool.json");
        if(!fs.existsSync(toolPath)){
            fs.writeFileSync(toolPath, "{}");
        }
        let configJSON = fs.readFileSync(toolPath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
        let config = JSON.parse(configJSON);
        config[key] = value;
        if(key === "registry"){
            shell.exec("npm set @base:registry " + value);
        }
        fs.writeFileSync(toolPath, JSON.stringify(config, null, "\t"));
    });
})();