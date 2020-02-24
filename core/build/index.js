const fs = require("fs");
const path = require("path");
const excludePattern = new RegExp(".spec.ts", "g");
const sourceDir = path.join(__dirname, "..", "source", "src");
const indexFile = path.join(sourceDir, "index.ts");
const distDir = path.join(__dirname, "../../tool/sample");

//readFile
function readFile(filePath, extension){
    if(!filePath.includes(extension)){
        filePath += extension;
    }
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if(err) reject(err);
            else resolve(data.toString());
        });
    });
}
//readStats
function readStats(filePath, extension){
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if(err){
                if(err.code === "ENOENT"){
                    if(filePath.includes(extension)){
                        reject(err);
                    }
                    else{
                        readStats(`${filePath + extension}`, extension).then(innerStats => {
                            resolve(innerStats);
                        }).catch((innerErr) => {
                            reject(innerErr);
                        });
                    }
                }
                else {
                    reject(err);
                }
            }
            else resolve(stats);
        });
    });
}
//writeFile
function writeFile(filePath, body){
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, body, (err) => {
            if(err) reject(err);
            else resolve();
        });
    });
}
//rewriteFile
function rewriteFile(filePath, extension, replacePattern){
    let newFileBody = "";
    let dir = path.dirname(filePath);
    return readFile(filePath, extension).then(fileBody => {
        newFileBody = fileBody;
        let files = fileBody.match(replacePattern.match) || [];
        let relativeFiles = files.map(relativeFile => {
            let file = relativeFile;
            replacePattern.replaces.map(replace => {
                file = file.replace(replace.cond, replace.to)
            });
            return path.join(dir, file);
        });
        let promiseList = [];
        relativeFiles.map(relativeFile => {
            promiseList.push(readStats(relativeFile, extension));
        });
        return Promise.all(promiseList).then(fileStats => {
            let innerPromiseList = [];
            fileStats.map((fileStat, i) => {
                if(fileStat.isDirectory()){
                    let innerIndexFille = path.join(relativeFiles[i], `index${extension}`);
                    innerPromiseList.push(rewriteFile(innerIndexFille, extension, replacePattern).then((innerFileBody) => {
                        newFileBody = newFileBody.replace(files[i], innerFileBody);
                    }));
                }
                else {
                    innerPromiseList.push(rewriteFile(`${relativeFiles[i]}`, extension, replacePattern).then((innerFileBody) => {
                        newFileBody = newFileBody.replace(files[i], innerFileBody)
                    }));
                }
            });
            return Promise.all(innerPromiseList);
        }).then(() => {
            return newFileBody;
        })
    });
}

rewriteFile(indexFile, ".ts", {
    match: /import\s+['"]\..*['"]/g,
    replaces: [
        {cond: /\s\s/g, to: ""},
        {cond: /;/g, to: ""},
        {cond: /import\s+/, to: ""},
        {cond: /['"]/g, to: ""}
    ]
}).then((newFileBody) => {
    let importClauses = newFileBody.match(/import.*['"].*['";]/g) || [];
    importClauses.map(importClause => {
        newFileBody = newFileBody.replace(`${importClause}\r\n`, "");
    });
    let importClauseLength = importClauses.length;
    let distinctImportClauses = [];
    for(let i = 0; i < importClauseLength; i++){
        if(!distinctImportClauses.includes(importClauses[i])){
            distinctImportClauses.push(importClauses[i]);
        }
    }
    distinctImportClauses.reverse().map(importClause => {
        newFileBody = `${importClause}\n` + newFileBody;
    });
    let coreFilePath = path.join(distDir, "core.ts");
    return writeFile(coreFilePath, newFileBody);
}).catch(e => {
    console.error(e);
});

const typingFile = path.join(__dirname, "..", "source", "typings.d.ts");
rewriteFile(typingFile, ".d.ts", {
    match: /\/\/\/\s+<reference\s+path=['"]\..*["']\s+\/>/g,
    replaces: [
        {cond: /\s\s/g, to: ""},
        {cond: /\/\/\/\s/g, to: ""},
        {cond: /<reference\s/g, to: ""},
        {cond: /\s\/>/g, to: ""},
        {cond: /path=/g, to: ""},
        {cond: /["']/g, to: ""}
    ]
}).then((newFileBody) => {
    let referenceClauses = newFileBody.match(/\/\/\/\s+<reference\s+types=['"].*["']\s+\/>/g) || [];
    referenceClauses.map(referenceClause => {
        newFileBody = newFileBody.replace(`${referenceClause}\r\n`, "");
    });
    let referenceClauseLength = referenceClauses.length;
    let distinctReferenceClauses = [];
    for(let i = 0; i < referenceClauseLength; i++){
        if(!distinctReferenceClauses.includes(referenceClauses[i])){
            distinctReferenceClauses.push(referenceClauses[i]);
        }
    }
    distinctReferenceClauses.reverse().map(referenceClause => {
        newFileBody = `${referenceClause}\n` + newFileBody;
    });
    let typingsFilePath = path.join(distDir, "typings.d.ts");
    return writeFile(typingsFilePath, newFileBody);
}).catch(e => {
    console.error(e);
});