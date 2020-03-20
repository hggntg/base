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
    commander.command("proj <action> [scope] [scope2]")
    .action((action: string, scope?: string, scope2?: string, scope3?: string) => {
        if(action === "new"){
            if(scope) return newProject(scope);
        }
        else if(action === "run"){
            return run(scope, scope2);
        }
        else if(action === "build"){
            return build(scope, scope2);
        }
        else if(action === "compile"){
            return compile();
        }
        else if(action === "fix"){
            return fix();
        }
        else if(action === "generate"){
            if(scope === "live") return generate(scope, scope2, scope3);
            else return generate(null, scope, scope2);
        }
        else if(action === "bundle"){
            return bundle(scope, scope2);
        }
        throw new Error("Missing arguments");
    });
})();