import { CommanderStatic } from "commander";
import { defaultValue } from "../../internal";
import { installPlugin } from "./plugin";
import { installInterface } from "./interface";
import { installCore } from "./core";

declare const commander : CommanderStatic;

interface IInstallModuleCommand{
    name?: string,
    type?: string
}

(function(){
    commander.command("install <what>")
    .description("install plugin")
    .option("-n, --name [pluginName]", "plugin name")
    .option("-t, --type [type]", "type of dependencies")
    .action((what: string, commands: IInstallModuleCommand) => {
        commands.name = defaultValue(commands.name, "string");
        commands.type = defaultValue(commands.type, "string") || "main";
        if(what === "plugin"){
            installPlugin(commands.name, commands.type);
        }
        else if(what === "interface"){
            installInterface(commands.name, commands.type);
        }
        else if(what === "core"){
            installCore(commands.name, commands.type);
        }
    });
})();