import path from "path";
import fs from "fs";
import shell from "shelljs";
import { getRootBasePath } from "../../infrastructure/utilities";
import rimraf from "rimraf";
import replace from "replace-in-file";
import { log } from "../../infrastructure/logger";
import { readdirRecursive } from "../project/internal";
function clean(root, pathName){
    let pathSegments = pathName.split("/");

    if(pathSegments.length > 1){
        let pathSegmentLength = pathSegments.length;
        let currentPath = path.join(root, pathName);
        let name = pathName;
        if(fs.existsSync(currentPath)){
            rimraf.sync(currentPath);
        }
        for(let i = pathSegmentLength - 1; i >= 0; i--){
            if(i === 0){
                name = name.replace(pathSegments[i], "");
            }
            else{
                name = name.replace("/" + pathSegments[i], "");
            }
            currentPath = path.join(currentPath, pathSegments[i]);
            if(fs.existsSync(currentPath)){
                let isEmpty = fs.readdirSync(currentPath).length > 0 ? false : true;
                if(isEmpty){
                    rimraf.sync(currentPath);
                }
            }
        }
        currentPath = root;
        for(let i = 0; i < pathSegmentLength; i++){
            currentPath = path.join(currentPath, pathSegments[i]);
            if(!fs.existsSync(currentPath)){
                fs.mkdirSync(currentPath);
            }
        }
    }
    else{
        let currentPath = path.join(root, pathName);
        if(fs.existsSync(currentPath)){
            rimraf.sync(currentPath);
        }
        fs.mkdirSync(currentPath);
    }
}

function copy(source, dest, ...files){
    files.map(file => {
        let relativeFile = path.join(source, file);
        if(fs.existsSync(relativeFile)){
            shell.cp("-R", relativeFile, path.join(dest, file));
        }
    });
}

export function buildModule(name: string, src?: string){
    let storePath = getRootBasePath();
    let sourcePath = process.cwd();
    let destPath = path.join(storePath, name);

    
    clean(storePath, name);

    
    shell.exec("npm version patch");
    copy(sourcePath, destPath, "package.json", "README.md", "logo");
    sourcePath = src ? path.join(sourcePath, src) : sourcePath;
    copy(sourcePath, destPath,"tsconfig.json", "typings.d.ts", "hooks");
    let tsconfigPath = path.join(sourcePath, "tsconfig.json");
    let output = null;
    output = shell.exec(`tsc -p ${tsconfigPath} --outDir ${destPath}`);
    if(output.stderr){
        console.error(output.stderr);
    }
    else{
        let files = [
            path.join(destPath, "*.d.ts"),
            path.join(destPath, "**/*.d.ts")
        ]
        replace({
            files: files,
            from: /\/\/\/ <reference types="(\.)+\/typings" \/>/g,
            to: ""
        }).then(() => {
            return import(path.join(destPath, "tsconfig.json")).then(tsconfigObject => {
                let compilerOptions = tsconfigObject.compilerOptions;
                delete compilerOptions.outDir;
                delete compilerOptions.paths;
                delete compilerOptions.include;
                let newTsconfigObject = {
                    compilerOptions: compilerOptions
                }
                return fs.writeFileSync(path.join(destPath, "tsconfig.json"), JSON.stringify(newTsconfigObject, null, 2));
            });
        }).then(() => {
            return replace({
                files: [path.join(destPath, "index.js")],
                from: /addAlias\(.+\);/g,
                to: ""
            })
        }).then(() => {
            return readdirRecursive(destPath).then((fileList: string[]) => {
                let filteredFileList = fileList;
                let filteredListLength = filteredFileList.length;
                let promiseList = [];

                for(let i = 0; i < filteredListLength; i++){
                    let filteredFile = filteredFileList[i];
                    let localFilePath = filteredFile.replace(destPath, "");
                    localFilePath = path.join("@app", localFilePath);
                    localFilePath = localFilePath.replace(/\\/g, "/");
                    let localFilePathSegment = localFilePath.split("/");
                    let localFilePathLength = localFilePathSegment.length;
                    promiseList.push(replace({
                        files: filteredFile,
                        from: /from\s*["']@app.*[^"']["']|require\(["']@app.*[^"']["']/g,
                        to: function(match, file){
                            match = match.match(/from\s*["']@app.*[^"']["']|require\(["']@app.*[^"']["']/g)[0];
                            let tempMatch = match.replace(/from\s*["']|require\(["']|["']/g, "");
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
                                    replacedPath = path.join(replacedPath, tempMatchSegment[j]);
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
                            match = match.replace(replacedPath, transformedPath);
                            
                            return match;
                        }
                    }));
                }
                return Promise.all(promiseList);
            });
        }).catch(err => {
            throw err;
        });
    }
}