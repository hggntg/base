const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const modules = fs.readdirSync(path.join(__dirname, "./"));

modules.map(module => {
    childProcess.execSync("tool publish " + module);
});