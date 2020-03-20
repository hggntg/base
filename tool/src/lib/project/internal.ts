import fs from "fs";
import path from "path";
import { log } from "../../infrastructure/logger";
export const folders = [
    "package.json",
    "tsconfig.json",
    "typings.d.ts",
]
export const folderLength = folders.length;

export function readdirRecursive(sourcePath, fileList: string[] = []){
    return new Promise((resolve, reject) => {
        fs.readdir(sourcePath, (err, files) => {
            if(err) reject(err);
            else {
                let promiseList = [];
                files.map(file => {
                    let filePath = path.join(sourcePath, file);
                    promiseList.push(new Promise((resolve, reject) => {
                        fs.stat(filePath, (err, stats) => {
                            if(err) reject(err);
                            else {
                                if(stats.isDirectory()) resolve(true);
                                else resolve(false);
                            }
                        })
                    }));
                });
                Promise.all(promiseList).then(async (results) => {
                    let resultLength = results.length;
                    for(let i = 0; i < resultLength; i++){
                        let result = results[i];
                        if(result){
                            try{
                                await readdirRecursive(path.join(sourcePath, files[i]), fileList) as string[];
                            }
                            catch(e){
                                log(e, "error");
                            }
                        }
                        else{
                            fileList.push(path.join(sourcePath, files[i]));
                        }
                    }
                    resolve(fileList);
                });
            }
        });
    });
}