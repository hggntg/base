import fs from "fs";
import shell from "shelljs";
import { log } from "../../infrastructure/logger";
import { join } from "path";
import rimraf, { Options } from "rimraf";
import replace from "replace-in-file";
import { readdirRecursive } from "./internal";

const TypescriptRoot = join(__dirname, "../../node_modules/typescript/bin");

function clean(path, options: Options, retry = 0, cb) {
    if (retry > 0) {
        log("Retry remove build folder " + retry + " time(s).");
    }
    rimraf(path, options, (err) => {
        if (err) {
            if (retry === 10) {
                cb(err, null);
            }
            else {
                clean(path, options, retry + 1, cb);
            }
        }
        else {
            cb(null, true);
        }
    });
}

export function compile() {
    let cwd = process.cwd();
    let buildFolder = join(cwd, "build");
    let tsconfigPath = join(cwd, ".generated/tsconfig.json");
    let packagePath = join(cwd, "package.json");
    let envPath = join(cwd, ".generated/.env");
    let dockerPath = join(cwd, "docker");
    if (!fs.existsSync(buildFolder)) {
        fs.mkdirSync(buildFolder);
        fs.copyFileSync(envPath, join(buildFolder, ".env"));
        fs.copyFileSync(packagePath, join(buildFolder, "package.json"));

        if (fs.existsSync(dockerPath)) {
            fs.copyFileSync(join(dockerPath, ".dockerignore"), join(buildFolder, ".dockerignore"));
            fs.copyFileSync(join(dockerPath, "docker-compose.yml"), join(buildFolder, "docker-compose.yml"));
            fs.copyFileSync(join(dockerPath, "Dockerfile"), join(buildFolder, "Dockerfile"));
        }

        let output = shell.exec(`tsc -p ${tsconfigPath} --declaration false --outDir ${buildFolder}/src`, { cwd: TypescriptRoot });
        if (output.stderr) {
            log(output.stderr, "error");
        }
        else {
            log(output.stdout);
            log("Compile done....");
        }
    }
    else {
        log("clearing build folder " + buildFolder);
        clean(buildFolder, { maxBusyTries: 10 }, 0, (err, status) => {
            if(err){
                log(err, "error");
            }
            try{
                fs.mkdirSync(buildFolder);
            }
            catch(e){
                log(e, "error");
            }

            
            fs.copyFileSync(envPath, join(buildFolder, ".env"));
            fs.copyFileSync(packagePath, join(buildFolder, "package.json"));

            if (fs.existsSync(dockerPath)) {
                fs.copyFileSync(join(dockerPath, ".dockerignore"), join(buildFolder, ".dockerignore"));
                fs.copyFileSync(join(dockerPath, "docker-compose.yml"), join(buildFolder, "docker-compose.yml"));
                fs.copyFileSync(join(dockerPath, "Dockerfile"), join(buildFolder, "Dockerfile"));
            }

            let output = shell.exec(`tsc -p ${tsconfigPath} --declaration false --outDir ${buildFolder}/src`, {cwd: TypescriptRoot});
            if (output.stderr) {
                log(output.stderr, "error");
            }
            else {
                buildFolder = join(buildFolder, "src");
                replace({
                    files: [join(buildFolder, "index.js")],
                    from: /addAlias\(.+\);/g,
                    to: ""
                }).then(() => {
                    return readdirRecursive(buildFolder).then((fileList: string[]) => {
                        let filteredFileList = fileList;
                        let filteredListLength = filteredFileList.length;
                        let promiseList = [];
        
                        for(let i = 0; i < filteredListLength; i++){
                            let filteredFile = filteredFileList[i];
                            let localFilePath = filteredFile.replace(buildFolder, "");
                            localFilePath = join("@app", localFilePath);
                            localFilePath = localFilePath.replace(/\\/g, "/");
                            let localFilePathSegment = localFilePath.split("/");
                            let localFilePathLength = localFilePathSegment.length;
                            promiseList.push(replace({
                                files: filteredFile,
                                from: /["']@app.*[^"']["']/g,
                                to: function(match, file){
                                    match = match.match(/["']@app.*[^"']["']/g)[0];
                                    let tempMatch = match.replace(/["']/g, "");
                                    let tempMatchSegment = tempMatch.split("/");
                                    let tempMatchLength = tempMatchSegment.length;
                                    let replacedPath = "";
                                    let transformedPath = "";
                                    let diffIndex = -1;
                                    for(let j = 0; j < tempMatchLength - 1; j++){
                                        if(localFilePathSegment[j] !== tempMatchSegment[j]){
                                            diffIndex = j;
                                            break;
                                        }
                                        else {
                                            replacedPath = join(replacedPath, tempMatchSegment[j]);
                                        }
                                    }
                                    if(diffIndex === -1){
                                        diffIndex = tempMatchLength - 1;
                                    }
                                    if(diffIndex >= 0){
                                        let restDot = Math.abs(localFilePathLength - 1 - diffIndex);
                                        for(let j = 0; j < restDot; j++){
                                            transformedPath += "/..";
                                        }
                                    }
                                    if(!transformedPath) transformedPath = ".";
                                    else transformedPath = transformedPath.substring(1, transformedPath.length);
                                    replacedPath = replacedPath.replace(/\\/g, "/");
                                    return match.replace(replacedPath, transformedPath);
                                }
                            }));
                        }
                        return Promise.all(promiseList);
                    });
                }).then(() => {
                    log("Compile done....");
                }).catch(e => {
                    log(e, "error");
                });
            }
        });
    }
}