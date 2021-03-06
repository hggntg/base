import { Project, FileSystemHost } from "ts-morph";
import EventEmitter from "events";
import queue from "queue";

import chokidar from "chokidar";
import { ChildProcess, spawn } from "child_process";
import { log } from "../../../infrastructure/logger";

import fsNode from "fs";
import sysPath, { join } from "path";
import { parallelLimit } from "async";
import { cpus } from "os";

const q = queue({
    autostart: true,
    concurrency: 1
});

export const mainEventSource = new EventEmitter();
const tsNodePath = sysPath.join(__dirname, "../../../node_modules/ts-node/dist/bin.js");


interface IFileItem {
    path: string;
    status: "CHANGED" | "NOT_CHANGED";
}

interface IFileList {
    [key: string]: IFileItem;
}


let pending = false;
let timeout = 1000;
let lastChange = (+ new Date());
let isFirstTime = true;
let firstTimeStartServer = true;
let startServerProcess: ChildProcess = null;
let appPath: string = null;
let sourcePath: string = null;
let generatePath: string = null;
let bouncer: NodeJS.Timeout = null;
let watcher: chokidar.FSWatcher = null;
let project: Project = null;
let fs: FileSystemHost = null;

let isRun: boolean = false;
let isLive: boolean = false;
let target: string = "";
let tsconfig: string = "";
let excludes: string[] = [];
let samplePath = sysPath.join(__dirname, "../../../sample");
const fileList: IFileList = {};

function divideTask(tasks: string[], divideTime: number = 2) {
    let taskSegment: Array<string[]> = [];
    let middleIndex = Math.ceil(tasks.length / divideTime);
    let start = 0;
    let end = 0;
    for (let i = 0; i < divideTime; i++) {
        start = end;
        end = start + middleIndex;
        if (end > tasks.length) end = tasks.length;
        taskSegment.push(tasks.slice(start, end))
    }
    return taskSegment;
}

async function main(sourceFiles: string[], generatedPath, isFirstTime: boolean) {
    if(isFirstTime){
        await new Promise((innerResolve, innerReject) => {
            fsNode.exists(tsconfig, async (exists) => {
                let tsconfigObject = await import(sysPath.join(appPath, tsconfig));
                if(tsconfigObject.exclude){
                    delete tsconfigObject.exclude;
                }
                delete tsconfigObject.default;
                if(target !== "root"){
                    if(tsconfigObject.compilerOptions){
                        if(tsconfigObject.compilerOptions.paths){
                            if(tsconfigObject.compilerOptions.paths["@app"]) tsconfigObject.compilerOptions.paths["@app"] = ["src/index.ts"];
                        }
                    }
                }
                if (exists) {
                    fsNode.writeFile(`${generatePath}/tsconfig.json`, JSON.stringify(tsconfigObject, null, 2), (err: NodeJS.ErrnoException) => {
                        if(err && err.code !== "ENOENT") innerReject(err);
                        else innerResolve(true);
                    })
                }
                else {
                    innerResolve(true);
                }
            });
        });
    }
    log("File total: " + sourceFiles.length);
    let divideTime = Math.ceil(sourceFiles.length / 9);
    let taskSegment = divideTask(sourceFiles, divideTime);
    log("Divide in " + divideTime + " segments");
    if (taskSegment.length > 1) {
        log("Has " + taskSegment.length + " tasks");
    }
    else {
        log("Has " + taskSegment.length + " task");
    }
    let parallelTasks = taskSegment.map((sourceSegmentList, index) => {
        let tempSourceSegmentList = sourceSegmentList.slice(0);
        if (tempSourceSegmentList.length > 1) {
            log("Has " + tempSourceSegmentList.length + " files in task " + (index + 1));
        }
        else {
            log("Has " + tempSourceSegmentList.length + " file in task " + (index + 1));
        }
        return function (callback) {
            let childProcess = spawn("node", ["main.js", "--appPath=" + appPath, "--src=" + tempSourceSegmentList.join(","), "--genPath=" + generatedPath, "--target=" + target, "--tsconfig=" + tsconfig], { cwd: __dirname, detached: true });
            childProcess.stdout.pipe(process.stdout);
            childProcess.unref();
            childProcess.stdout.once("end", () => {
                callback();
            });
        }
    });
    let promiseTask = new Promise((resolve, reject) => {
        let limit = cpus().length / 3;
        if (limit % 2 !== 0) limit = Math.ceil(limit);
        parallelLimit(parallelTasks, limit, (err, results) => {
            if (err) reject(err);
            else resolve();
        });
    });
    await promiseTask;
    if (isFirstTime) {
        let promise = new Promise((resolve, reject) => {
            let promiseList = [];
            promiseList.push(new Promise((innerResolve, innerReject) => {
                fsNode.exists("typings.d.ts", (exists) => {
                    if (exists) {
                        fsNode.copyFile("typings.d.ts", `${generatedPath}/typings.d.ts`, (err: NodeJS.ErrnoException) => {
                            if (err && err.code !== "ENOENT") innerReject(err);
                            else innerResolve(true);
                        });
                    }
                    else {
                        innerResolve(true);
                    }
                })
            }));
            promiseList.push(new Promise((innerResolve, innerReject) => {
                fsNode.exists(".env", (exists) => {
                    if (exists) {
                        fsNode.copyFile(".env", `${generatePath}/.env`, (err: NodeJS.ErrnoException) => {
                            if (err && err.code !== "ENOENT") innerReject(err);
                            else innerResolve(true);
                        });
                    }
                    else {
                        innerResolve(true);
                    }
                })
            }));
            return Promise.all(promiseList).then(() => {
                resolve(true);
            }).catch(err => {
                reject(err);
            })
        });
        await promise;
        project.createSourceFile(`${generatedPath}/src/core.ts`, fs.readFileSync(sysPath.join(samplePath, "core.ts")).toString(), { overwrite: true });
    }
    let typeDeclareText = "";
    // typeDeclares.map((typeDeclare) => {
    //     typeDeclareText += `Type.declare(${JSON.stringify(typeDeclare)});\n`;
    // });
    let promise = new Promise((resolve, reject) => {
        fsNode.writeFile(`${generatedPath}/src/declare.ts`, typeDeclareText, { encoding: "utf8" }, (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    })
    await promise;
    return project.save();
}
mainEventSource.once("start", async (_appPath: string, _isRun: boolean, _isLive: boolean, _target: string, _tsconfig: string) => {
    isRun = _isRun;
    isLive = _isLive;
    target = _target ? _target : "root";
    tsconfig = _tsconfig ? _tsconfig : "tsconfig.root.json";
    if (isRun) {
        isLive = true;
    }
    appPath = _appPath;
    project = new Project({
        tsConfigFilePath: sysPath.resolve(sysPath.join(appPath, tsconfig))
    });
    let tsconfigObject = await import(sysPath.join(appPath, tsconfig));
    if(tsconfigObject.exclude){
        excludes = tsconfigObject.exclude.slice(0);
        excludes = excludes.map((exclude) => {
            return join(process.cwd(), exclude);
        });
    }

    fs = project.getFileSystem();
    sourcePath = sysPath.join(appPath, "src");

    let targetPath = sysPath.join(appPath, ".generated");
    if (!fsNode.existsSync(targetPath)) fsNode.mkdirSync(targetPath);

    generatePath = sysPath.join(targetPath, target);
    if (!fsNode.existsSync(generatePath)) fsNode.mkdirSync(generatePath);

    let srcGeneratedPath = sysPath.join(generatePath, "src");
    if (!fsNode.existsSync(srcGeneratedPath)) fsNode.mkdirSync(srcGeneratedPath);
    bouncer = setInterval(() => {
        let current = (+ new Date());
        let diff = current - lastChange;
        if (diff >= timeout && diff < Math.floor(timeout * 2)) {
            if (isLive) {
                if (!pending) {
                    pending = true;
                    mainEventSource.emit("change", isFirstTime);
                    isFirstTime = false;
                }
            }
            else {
                mainEventSource.emit("change", isFirstTime);
                clearInterval(bouncer);
            }
        }
    }, 950);
    watcher = chokidar.watch(sourcePath, {
        persistent: true,
        interval: 1000,
        atomic: 1000
    });
    watcher.on('add', (path, stats) => {
        if(!excludes.includes(path)){
            fileList[path] = { path: path, status: "CHANGED" };
            lastChange = (+new Date());
        }
    }).on('change', (path, stats) => {
        if(!excludes.includes(path)){
            fileList[path].status = "CHANGED";
            lastChange = (+ new Date());
        }
    }).on('unlink', (path) => {
        q.push((callback) => {
            delete fileList[path];
            let generatedPath = sysPath.join(generatePath, path);
            project.removeSourceFile(project.getSourceFile(generatedPath));
            fs.delete(generatedPath).then(() => {
                return project.save().then(() => {
                    setTimeout(() => {
                        callback();
                    }, 1);
                });
            }).catch(err => {
                throw err;
            })
        });
    });
});

function checkProcessKilled(processServer: ChildProcess): Promise<boolean> {
    return new Promise((resolve, reject) => {
        processServer.once("exit", (code) => {
            resolve(true);
        }).on("error", (err) => {
            reject(err);
        })
    });
}
let sourceFileChanged = false;
mainEventSource.on("change", async (isFirstTime: boolean) => {
    let sourceFilePaths = [];
    Object.values(fileList).map(fileItem => {
        if (fileItem.status === "CHANGED") {
            sourceFileChanged = true;
            sourceFilePaths.push(fileItem.path);
        }
    });
    if(sourceFileChanged){
        sourceFileChanged = false;
        if (startServerProcess) {
            startServerProcess.send({ event: "STOP" });
            try{
                let isKilled = await checkProcessKilled(startServerProcess);
                if (isKilled) {
                    log("Kill old process done.........");
                    startServerProcess = null;
                }
            }
            catch(e){
                log(e, "error");
                process.exit(1);
            }
        }
        log("Ready to generate source files........");
        if (!startServerProcess) {
            await main(sourceFilePaths, generatePath, isFirstTime).then(() => {
                Object.keys(fileList).map(key => {
                    fileList[key].status = "NOT_CHANGED";
                });
                pending = false;
                log("Generating done........");
                if (isLive) {
                    log("Waiting for changes.....");
                    if (isRun) {
                        log("Starting to run app");
                        startServerProcess = spawn("node", [tsNodePath, join(generatePath, "src", "index.ts")], { cwd: process.cwd(), env: { NPM_CONFIG_COLOR: "always", FORCE_COLOR: "1" }, stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
                        startServerProcess.unref();
                    }
                }
                else {
                    mainEventSource.emit("end");
                }
            }).catch(err => {
                throw err;
            });
        }
    }
    else{
        sourceFileChanged = false;
    }
});

process.on("SIGINT", () => {
    clearInterval(bouncer);
    watcher.close();
    mainEventSource.removeAllListeners();
    if (startServerProcess) startServerProcess.kill();
})