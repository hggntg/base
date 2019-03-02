import { CommanderStatic } from "commander";
import { serveRegistry } from "./serve";
import { addUser } from "./adduser";

declare const commander : CommanderStatic;

(function(){
    commander.command("registry <action>")
    .action((action: string) => {
        console.log(action);
        if(action === "serve"){
            serveRegistry();
        }
        else if(action === "adduser"){
            addUser();
        }
    });
})();