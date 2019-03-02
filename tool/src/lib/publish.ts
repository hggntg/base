import { CommanderStatic } from "commander";
import shell from "shelljs";
import fs from "fs";
import path from "path";
import { getRootBasePath, getConfig } from "../infrastructure/utilities";

declare const commander : CommanderStatic;

(function(){
    commander.command("publish <name>")
    .description("publish module to registry")
    .action((name: string) => {
        let storePath = getRootBasePath();
        let modulePath = path.join(storePath, name);
        let registry = getConfig("registry");
        shell.cd(modulePath);
        shell.exec("npm publish --registry" + registry);
    });
})();