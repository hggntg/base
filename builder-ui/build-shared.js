const fs = require('fs-extra');
const path = require("path");
const distFolder = path.join(__dirname, "dist");
const projectPath = path.join(distFolder, "builder-ui-shared");

fs.unlinkSync(path.join(projectPath, "index.html"));
fs.unlinkSync(path.join(projectPath, "favicon.ico"));
fs.unlinkSync(path.join(projectPath, "3rdpartylicenses.txt"));
fs.unlinkSync(path.join(projectPath, "main-es5.js"));
fs.unlinkSync(path.join(projectPath, "runtime-es5.js"));
fs.unlinkSync(path.join(projectPath, "main-es2015.js"));
fs.unlinkSync(path.join(projectPath, "runtime-es2015.js"));
fs.unlinkSync(path.join(projectPath, "styles.css"));
fs.unlinkSync(path.join(projectPath, "polyfills-es2015.js"));
fs.renameSync(path.join(projectPath, "polyfills-es5.js"), path.join(projectPath, "main.js"));