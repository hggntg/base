import childProcess, { ChildProcess } from "child_process";
import fs from "fs";
import shell from "shelljs";
import path from "path";

import { log } from "../../infrastructure/logger";

export function newProject(appName: string) {
    let cwd = process.cwd();
    appName = appName.toLowerCase().replace(/\s\s/g, " ").replace(/\s/g, "-");
    let appPath = path.join(cwd, appName);
    if (fs.existsSync(appPath)) {
        throw new Error("Application is exists");
    }
    else {
        shell.mkdir(appPath);
        shell.cd(appPath);
        childProcess.execSync("npm init", { stdio: "inherit" });
        let sourcePath = path.join(appPath, "src");
        let samplePath = path.join(__dirname, "../../sample");
        log("Generating some core files......");
        fs.mkdirSync(sourcePath);
        fs.copyFileSync(path.join(samplePath, "index.ts"), path.join(sourcePath, "index.ts"));
        fs.copyFileSync(path.join(appPath, ".env"), path.join(appPath, ".env"));
        fs.copyFileSync(path.join(appPath, "default.env"), path.join(appPath, "default.env"));
        let infrastructurePath = path.join(sourcePath, "infrastructure");
        fs.mkdirSync(infrastructurePath);
        let configPath = path.join(infrastructurePath, "config");
        fs.mkdirSync(configPath);
        fs.writeFileSync(path.join(configPath, "default.json"), `{}`);
        let configSectionPath = path.join(infrastructurePath, "config-section");
        fs.mkdirSync(configSectionPath);
        fs.writeFileSync(path.join(configSectionPath, "index.ts"), "");
        log("Installing needed dependencies......");
        log("> tool install core -n builder");
        let installBuilderProcess = shell.exec("tool install core -n builder", { async: true, env: { NPM_CONFIG_COLOR: "always", FORCE_COLOR: "1" } }) as ChildProcess;
        installBuilderProcess.stdout.on("data", (chunk: Buffer) => {
            log(chunk.toString());
        });
        installBuilderProcess.stderr.on("data", (chunk: Buffer) => {
            log(chunk.toString(), "error");
        });
        let installNodeProcess = shell.exec("npm install @types/node @types/webpack ts-loader typescript inversify reflect-metadata -D", { async: true, env: { NPM_CONFIG_COLOR: "always", FORCE_COLOR: "1" } }) as ChildProcess;
        installNodeProcess.stdout.on("data", (chunk: Buffer) => {
            log(chunk.toString());
        });
        installNodeProcess.stderr.on("data", (chunk: Buffer) => {
            log(chunk.toString(), "error");
        });
        fs.copyFileSync(path.join(samplePath, "tsconfig.json"), path.join(appPath, "tsconfig.json"));
        fs.copyFileSync(path.join(samplePath, "tsconfig.root.json"), path.join(appPath, "tsconfig.root.json"));
        fs.copyFileSync(path.join(samplePath, "typings.d.ts"), path.join(appPath, "typings.d.ts"));
    }
}