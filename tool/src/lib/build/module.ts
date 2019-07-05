import path from "path";
import fs from "fs";
import shell from "shelljs";
import { getRootBasePath } from "../../infrastructure/utilities";
import rimraf from "rimraf";
import replace from "replace-in-file";
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
    copy(sourcePath, destPath,"tsconfig.json", "typings.d.ts");
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
                let newTsconfigObject = {
                    compilerOptions: compilerOptions
                }
                return fs.writeFileSync(path.join(destPath, "tsconfig.json"), JSON.stringify(newTsconfigObject, null, 2));
            });
        }).catch(err => {
            throw err;
        });
    }
}