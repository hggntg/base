const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const basePath = path.join(__dirname, "../");

const modules =[
    {name: "tool", path: "tool"},
    {name: "test", path: "backend/test"},
    {name: "utilities", path: "utilities"},
    {name: "interfaces", path: "interfaces"},
    {name: "class", path: "backend/class"},
    {name: "database", path: "backend/database"},
    {name: "api", path: "backend/api"},
    {name: "builder", path: "builder"}
];

modules.map(module => {
    childProcess.execSync("cd " + path.join(basePath, module.path));
    childProcess.execSync("tool build module --name ", module.name);
    childProcess.execSync("tool publish " + module.name);
});