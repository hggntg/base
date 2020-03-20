import { CommanderStatic } from "commander";
import path from "path";
import fs from "fs";

declare const commander: CommanderStatic;

const requiredField = [
    "name"
];

(function(){
    commander.command("validate <what>")
    .description("validate your service")
    .action((what: string) => {
        let currentPath = process.cwd();
        if(what === "service"){
            if(fs.existsSync(path.join(currentPath, "service.json"))){

            }
            else{
                throw new Error("service.json not found");
            }
        }
        else if(what === "module"){

        }
    });
})();