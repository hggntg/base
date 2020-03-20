const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));
const name = argv["name"];
if(!name){
    throw new Error("Missing name of your project");
}
else {
    const fs = require('fs-extra');
    const path = require("path");
    const distFolder = path.join(__dirname, "dist");
    const projectPath = path.join(distFolder, name);
    if(!fs.existsSync(projectPath)){
       throw new Error(`Project ${name} not found`); 
    }
    else {
        const concat = require('concat');
        (async function build() {
          const es5files = [
            path.join(projectPath, 'runtime-es5.js'),
            path.join(projectPath, 'scripts.js'),
            path.join(projectPath, 'main-es5.js')
          ]
          const es2015files = [
            path.join(projectPath, 'runtime-es2015.js'),
            path.join(projectPath, 'scripts.js'),
            path.join(projectPath, 'main-es2015.js'),
          ]
          await fs.ensureDir(projectPath)
          await concat(es5files, path.join(projectPath, `main.js`));
          fs.renameSync(path.join(projectPath, "styles.css"), path.join(projectPath, `main.css`));
          es2015files.splice(1, 1);
          es2015files.map(file => {
            fs.unlinkSync(file);
          });
          es5files.map(file => {
            fs.unlinkSync(file);
          });
          fs.unlinkSync(path.join(projectPath, "index.html"));
          fs.unlinkSync(path.join(projectPath, "favicon.ico"));
          fs.unlinkSync(path.join(projectPath, "3rdpartylicenses.txt"));
          fs.unlinkSync(path.join(projectPath, "polyfills-es5.js"));
          fs.unlinkSync(path.join(projectPath, "polyfills-es2015.js"));
        })();
    }
}