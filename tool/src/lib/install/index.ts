import { CommanderStatic } from "commander";
import { defaultValue } from "../../internal";
import { installModule } from "./module";

declare const commander : CommanderStatic;

interface IInstallModuleCommand{
    name?: string
}

(function(){
    commander.command("install <what>")
    .description("install module")
    .option("-n, --name [moduleName]", "module name")
    .action((what: string, commands: IInstallModuleCommand) => {
        commands.name = defaultValue(commands.name, "string");
        if(what === "module"){
            installModule(commands.name);
        }
    });
})();