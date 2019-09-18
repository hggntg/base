import childProcess from "child_process";
import fs from "fs";
import shell from "shelljs";
import path from "path";

import { nodemon, tsconfig, typing, indexts } from "./assets";
import { log } from "../../infrastructure/logger";
import { defaultEnv, env } from "./assets/normal.env";

export function newProject(appName: string) {
    let cwd = process.cwd();
    appName = appName.toLowerCase().replace(/\s\s/g, " ").replace(/\s/g, "-");
    let appPath = path.join(cwd, appName);
    if(fs.existsSync(appPath)){
        throw new Error("Application is exists");
    }
    else{
        shell.mkdir(appPath);
        shell.cd(appPath);
        childProcess.execSync("npm init", { stdio: "inherit" });
        let sourcePath = path.join(appPath, "src");
        log("Generating some core files......");
        fs.mkdirSync(sourcePath);
        fs.writeFileSync(path.join(sourcePath, "index.ts"), indexts);
        fs.writeFileSync(path.join(appPath, ".env"), env);
        fs.writeFileSync(path.join(appPath, "default.env"), defaultEnv);
        let infrastructurePath = path.join(sourcePath, "infrastructure");
        fs.mkdirSync(infrastructurePath);
        let configPath = path.join(infrastructurePath, "config");
        fs.mkdirSync(configPath);
        fs.writeFileSync(path.join(configPath, "default.json"), `{}`);
        let configSectionPath = path.join(infrastructurePath, "config-section");
        fs.mkdirSync(configSectionPath);
        fs.writeFileSync(path.join(configSectionPath, "index.ts"), "");
        log("Installing needed dependencies......");
        shell.exec("npm install @types/node typescript nodemon ts-node -D", {silent: false});
        shell.exec("tool install core -n class -t dev");
        shell.exec("tool install core -n builder");
        fs.writeFileSync(path.join(appPath, "tsconfig.json"), tsconfig);
        fs.writeFileSync(path.join(appPath, "typings.d.ts"), typing);
        fs.writeFileSync(path.join(appPath, "nodemon.json"), nodemon);
    }
}