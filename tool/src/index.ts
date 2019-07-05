#!/usr/bin/env node

import commander from "commander";

global["commander"] = commander;

import "./lib/build";
import "./lib/install";
import "./lib/set";
import "./lib/publish";
import "./lib/registry";
import "./lib/update";
import "./lib/project";
import { log } from "./infrastructure/logger";

process.on('uncaughtException', (err) => {
    log(err, "error");
});

process.on('unhandledRejection', (err) => {
    log(err, "error");
});

//#region old code
// commander
//     .command("build-dependency")
//     .description("Build dependency")
//     .option("--depName <depName>", "Your dependency's name")
//     .action((options) => {
//         let microserviceConfigPath = path.join(currentPath, "microservice.json");
//         if (!fs.existsSync(microserviceConfigPath)) {
//             throw new Error("Cannot find a microservice.json file");
//         }
//         let microserviceConfigString: string = fs.readFileSync(microserviceConfigPath).toString();
//         let microserviceConfig: IMicroServiceConfig = {};
//         try {
//             microserviceConfig = JSON.parse(microserviceConfigString);
//         }
//         catch (e) {
//             throw e;
//         }
//         let depName = options.depName;
//         if (!depName) {
//             throw new Error("Missing dependency's name");
//         }
//         let dependencyPath = "../lib";
//         if (microserviceConfig.dependencyPath) {
//             dependencyPath = microserviceConfig.dependencyPath;
//         }
//         if (!fs.existsSync(path.join(currentPath, dependencyPath))) {
//             throw new Error("Dependency storage not found");
//         }
//         let dependencyFilePath = path.join(currentPath, dependencyPath, depName);
//         shell.cd(dependencyFilePath);
//         shell.rm("-rf", path.join(dependencyFilePath, "dist"));
//         shell.exec("npm run build");
//     });

// commander
//     .command("install-dependency")
//     .description("Install dependency")
//     .option("--depName <depName>", "Your dependency's name")
//     .action((options) => {
//         if (!fs.existsSync(path.join(currentPath, "package.json"))) {
//             throw new Error("Cannot find a package.json file");
//         }
//         let microserviceConfigPath = path.join(currentPath, "microservice.json");
//         if (!fs.existsSync(microserviceConfigPath)) {
//             throw new Error("Cannot find a microservice.json file");
//         }
//         let microserviceConfigString: string = fs.readFileSync(microserviceConfigPath).toString();
//         let microserviceConfig: IMicroServiceConfig = {};
//         try {
//             microserviceConfig = JSON.parse(microserviceConfigString);
//         }
//         catch (e) {
//             throw e;
//         }
//         let depName = options.depName;
//         if (!depName) {
//             throw new Error("Missing dependency's name");
//         }
//         let dependencyPath = "../lib";
//         if (microserviceConfig.dependencyPath) {
//             dependencyPath = microserviceConfig.dependencyPath;
//         }
//         if (!fs.existsSync(path.join(currentPath, dependencyPath))) {
//             throw new Error("Dependency storage not found");
//         }
//         let dependencyFilePath = path.join(currentPath, dependencyPath, depName);
//         shell.exec("npm install " + dependencyFilePath);
//     });

//#endregion

commander.parse(process.argv);