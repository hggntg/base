const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const bundlePath = path.resolve(cwd, "bundle");
const copiedList = [
    { src : 'typings.extend.d.ts', dest: 'indexTemplate.html.tpl' },
];
copiedList.map(copiedObject => {
    fs.copyFileSync(path.resolve(cwd, copiedObject.src), path.resolve(bundlePath, copiedObject.dest));
});
process.exit(0);