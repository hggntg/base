import { Project, FileSystemHost } from "ts-morph";
import EventEmitter from "events";
import queue from "queue";

import chokidar from "chokidar";
import { ChildProcess, spawn } from "child_process";
import { corets } from "../assets/normal.corets";
import { log, clear } from "../../../infrastructure/logger";

import fsNode from "fs";
import npmRun from "npm-run";
import sysPath from "path";
import { parallelLimit } from "async";
import { cpus } from "os";

const q = queue({
    autostart: true,
    concurrency: 1
});

export const mainEventSource = new EventEmitter();



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

const fileList: IFileList = {};

function divideTask(tasks: string[], divideTime: number = 2) {
    let taskSegment: Array<string[]> = [];
    let middleIndex = Math.floor(tasks.length / divideTime);
    let start = 0;
    let end = -1;
    for (let i = 0; i < divideTime; i++) {
        start = end + 1;
        end = i === 0 ? end + start + middleIndex : start + middleIndex;
        if (end > tasks.length) end = tasks.length - 1;
        taskSegment.push(tasks.slice(start, end))
    }
    return taskSegment;
}

async function main(sourceFiles: string[], generatedPath, isFirstTime: boolean) {
    let divideTime = Math.ceil(sourceFiles.length / 9);
    let taskSegment = divideTask(sourceFiles, divideTime);
    log("Divide in " + divideTime + " segments");
    let parallelTasks = taskSegment.map((sourceSegmentList, index) => {
        let tempSourceSegmentList = sourceSegmentList.slice(0);
        return function (callback) {
            let childProcess = spawn("node", ["main.js", "--appPath=" + appPath, "--src=" + tempSourceSegmentList.join(","), "--genPath=" + generatedPath], { cwd: __dirname, detached: true });
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
                fsNode.exists("tsconfig.json", (exists) => {
                    if (exists) {
                        fsNode.copyFile("tsconfig.json", `${generatedPath}/tsconfig.json`, (err: NodeJS.ErrnoException) => {
                            if (err && err.code !== "ENOENT") innerReject(err);
                            else innerResolve(true);
                        });
                    }
                    else {
                        innerResolve(true);
                    }
                });
            }));
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
        project.createSourceFile(`${generatedPath}/src/core.ts`, corets, { overwrite: true });
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
mainEventSource.once("start", (_appPath: string, _isRun: boolean, _isLive: boolean) => {
    isRun = _isRun;
    isLive = _isLive;
    if (isRun) {
        isLive = true;
    }
    appPath = _appPath;
    project = new Project({
        tsConfigFilePath: sysPath.resolve(sysPath.join(appPath, "tsconfig.json"))
    });
    fs = project.getFileSystem();
    sourcePath = sysPath.join(appPath, "src");

    generatePath = sysPath.join(appPath, ".generated");
    let srcGeneratedPath = sysPath.join(generatePath, "src");
    if (!fsNode.existsSync(generatePath)) fsNode.mkdirSync(generatePath);
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
        fileList[path] = { path: path, status: "CHANGED" };
        lastChange = (+new Date());
    }).on('change', (path, stats) => {
        fileList[path].status = "CHANGED";
        lastChange = (+ new Date());
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

mainEventSource.on("change", async (isFirstTime: boolean) => {
    let sourceFilePaths = [];
    Object.values(fileList).map(fileItem => {
        if (fileItem.status === "CHANGED") {
            sourceFilePaths.push(fileItem.path);
        }
    });
    log("Ready to generate source files........");
    await main(sourceFilePaths, generatePath, isFirstTime).then(() => {
        Object.keys(fileList).map(key => {
            fileList[key].status = "NOT_CHANGED";
        });
        pending = false;
        log("Generating done........");
        if (isLive) {
            log("Waiting for changes.....");
            if (firstTimeStartServer && isRun) {
                log("Starting to run app");
                startServerProcess = npmRun("nodemon");
                startServerProcess.stdout.off("data", () => { }).on("data", (chunk) => {
                    log(chunk.toString());
                });
                startServerProcess.stdout.off("error", () => { }).on("error", (chunk) => {
                    log(chunk.toString());
                });
                startServerProcess.stderr.off("data", (err) => { }).on("data", (chunk) => {
                    log(chunk.toString());
                });
                startServerProcess.stderr.off("error", (err) => { }).on("error", (chunk) => {
                    log(chunk.toString());
                });
                startServerProcess.off("error", (err) => { }).on("error", (err) => {
                    log(err.message + "\n" + err.stack, "error");
                });
                startServerProcess.unref();
                firstTimeStartServer = false;
            }
        }
        else {
            process.exit(0);
        }
    }).catch(err => {
        throw err;
    });
});

process.on("SIGINT", () => {
    clearInterval(bouncer);
    watcher.close();
    mainEventSource.removeAllListeners();
    if (startServerProcess) startServerProcess.kill();
})