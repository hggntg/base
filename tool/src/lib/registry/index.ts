import { CommanderStatic } from "commander";
import { serveRegistry } from "./serve";
import { addUser } from "./adduser";

declare const commander : CommanderStatic;

(function(){
    commander.command("registry <action> <scope>")
    .action((action: string, scope: string) => {
        if(action === "serve"){
            serveRegistry();
        }
        else if(action === "adduser"){
            addUser(scope);
        }
    });
})();