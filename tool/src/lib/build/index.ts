import { CommanderStatic } from "commander";
import { defaultValue } from "../../internal";
import { buildService } from "./app";
import { buildModule } from "./module";

declare const commander : CommanderStatic;

interface IBuildServiceCommand{
    live?: boolean,
    test?: boolean,
    name?: string,
    src?: string
}

(function(){
    commander.command("build <what>")
    .description("build your app")
    .option("--live", "build your app and serve app live")
    .option("--test", "apply test before serve")
    .option("--name [moduleName]", "name of your module")
    .option("--src [source]", "your folder source code")
    .action((what: string, commands: IBuildServiceCommand) => {
        commands.live = defaultValue(commands.live, "boolean");
        commands.test = defaultValue(commands.test, "boolean");
        let path = process.cwd();
        if(what === "service"){
            buildService();
        }
        else if(what === "module"){
            buildModule(commands.name, commands.src);
        }
    });
})();