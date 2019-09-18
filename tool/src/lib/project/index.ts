import { CommanderStatic } from "commander";
import { newProject } from "./new";
import { run } from "./run";
import { build } from "./build";
import { fix } from "./fix";
import { generate } from "./generate";
import { compile } from "./compile";
import { bundle } from "./bundle";

declare const commander : CommanderStatic;

(function(){
    commander.command("proj <action> [scope]")
    .action((action: string, scope?: string) => {
        if(action === "new"){
            if(scope) return newProject(scope);
        }
        else if(action === "run"){
            return run();
        }
        else if(action === "build"){
            return build(scope);
        }
        else if(action === "compile"){
            return compile();
        }
        else if(action === "fix"){
            return fix(scope);
        }
        else if(action === "generate"){
            if(scope === "live") return generate(scope);
            else return generate();
        }
        else if(action === "bundle"){
            return bundle();
        }
        throw new Error("Missing arguments");
    });
})();