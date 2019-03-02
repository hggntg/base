const path = require("path");
const fs = require("fs");
const shell = require("shelljs");
const storePath = path.resolve(process.cwd(), "../store/tool/");
if(fs.existsSync(storePath)){
    shell.rm('-rf', storePath);
}
fs.mkdirSync(storePath);
const sourcePath = path.resolve(process.cwd());
shell.cp("-R", path.join(sourcePath, "package.json"), path.join(storePath, "package.json"));
shell.exec("tsc");
shell.cd(storePath);