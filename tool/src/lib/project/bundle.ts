import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";
import { log } from "../../infrastructure/logger";
import rimraf from "rimraf";
import replaceInFile from "replace-in-file";

const webpackPath = path.join(__dirname, "../../node_modules/webpack/bin/webpack.js");

function cleanBundle(retryTime = 0) {
    let bundlePath = path.join(process.cwd(), "bundle");
    if (fs.existsSync(bundlePath)) {
        try {
            rimraf.sync(bundlePath);
        }
        catch (e) {
            if (retryTime++ > 10) {
                return cleanBundle(retryTime);
            }
            throw e;
        }
    }
}

export function bundle(target?: string, config?: string) {
    if (!target) target = "root";
    if (!config) config = "webpack.config.ts";
    let cwd = process.cwd();
    let webpackConfigFile = path.join(cwd, config);
    let nodeModulePath = path.join(cwd, "node_modules");
    if (fs.existsSync(webpackConfigFile)) {
        let dirs = fs.readdirSync(nodeModulePath);
        let innerDirs = [];
        dirs.filter((dir) => {
            return ["@base", "@base-plugins"].includes(dir);
        }).map(async (dir) => {
            let tempDirs = fs.readdirSync(path.join(nodeModulePath, dir));
            tempDirs = tempDirs.map(tempDir => {
                return path.join(nodeModulePath, dir, tempDir);
            })
            innerDirs = innerDirs.concat(tempDirs);
        });
        innerDirs.push(cwd);
        let promiseList = [];
        let bundlesHook = {
            pre: [],
            post: [],
        }
        innerDirs.map(innerDir => {
            promiseList.push(new Promise((resolve, reject) => {
                import(path.join(innerDir, "package.json")).then((info) => {
                    if (info.bundleHook) {
                        let preCmd;
                        let postCmd;
                        if (innerDir === cwd) {
                            if (info.bundleHook[target]) preCmd = info.bundleHook[target].pre;
                            if (info.bundleHook[target]) postCmd = info.bundleHook[target].post;
                        }
                        else {
                            preCmd = info.bundleHook.pre;
                            postCmd = info.bundleHook.post;
                        }
                        if (preCmd) bundlesHook.pre.push({ cmd: preCmd, cwd: innerDir });
                        if (postCmd) bundlesHook.post.push({ cmd: postCmd, cwd: innerDir });
                    }
                    resolve();
                }).catch(e => {
                    reject(e);
                });
            }));
        });
        log("Cleaning bundle folder.........");
        cleanBundle();
        Promise.all(promiseList).then(() => {
            let preLength = bundlesHook.pre.length;
            log("Ready run pre bundle app");
            for (let i = 0; i < preLength; i++) {
                let pre = bundlesHook.pre[i];
                let preSegments = pre.cmd.split(" ");
                let first = preSegments[0];
                preSegments.splice(0, 1);
                let result = spawnSync(first, preSegments, { cwd: pre.cwd });
                if (result.error) throw result.error;
                else {
                    log(result.stdout.toString());
                }
            }
            let cmd = `${webpackPath} --config ${webpackConfigFile}`;
            log(`> webpack --config ${webpackConfigFile}`);
            let bundleProcess = spawn("node", cmd.split(" "), { cwd: cwd, detached: true, env: { NPM_CONFIG_COLOR: "always", FORCE_COLOR: "1" } });
            bundleProcess.unref();
            bundleProcess.stderr.on("error", (err) => {
                throw err;
            }).on("data", (chunk: Buffer) => {
                log(chunk.toString(), "error");
            });
            bundleProcess.stdout.on("error", (err) => {
                throw err;
            }).on("data", (chunk: Buffer) => {
                log(chunk.toString());
            }).once("end", () => {
                log("Ready run post bundle app");
                let postLength = bundlesHook.post.length;
                replaceInFile.sync({
                    files: path.join(cwd, "bundle", "index.js"),
                    from: /\s"none"/g,
                    to: " process.env.NODE_ENV "
                });
                replaceInFile.sync({
                    files: path.join(cwd, "bundle", "index.js"),
                    from: /\("none"\)/g,
                    to: "(process.env.NODE_ENV)"
                });
                replaceInFile.sync({
                    files: path.join(cwd, "bundle", "index.js"),
                    from: /opts\.env/g,
                    to: "process.env.NODE_ENV"
                });
                replaceInFile.sync({
                    files: path.join(cwd, "bundle", "index.js"),
                    from: /"production"/g,
                    to: "process.env.NODE_ENV"
                });
                setTimeout(() => {
                    for (let i = 0; i < postLength; i++) {
                        let post = bundlesHook.post[i];
                        let cmdSegments = post.cmd.split(" ");
                        let cmd = cmdSegments[0];
                        cmdSegments.splice(0, 1);
                        let argument = cmdSegments.join(" ");
                        argument = argument.replace(/\$pwd/, post.cwd);
                        log(`> ${cmd} ${argument}`);
                        let resultProcess = spawn(cmd, argument.split(" "), { cwd: cwd, env: { NPM_CONFIG_COLOR: "always", FORCE_COLOR: "1" } });
                        resultProcess.stdout.on("data", (chunk: Buffer) => {
                            log(chunk.toString());
                        });
                        resultProcess.stderr.on("data", (chunk: Buffer) => {
                            log(chunk.toString());
                        });
                    }
                }, 1500);
            });
        }).catch(e => {
            throw e;
        });
    }
    else {
        throw new Error("Missing webpack config.........");
    }
}