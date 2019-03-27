const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const basePath = path.join(__dirname, "../");

const modules =[
    {name: "logger", path: "backend/logger"},
    {name: "test", path: "backend/test"},
    {name: "utilities", path: "utilities"},
    {name: "interfaces", path: "interfaces"},
    {name: "class", path: "backend/class"},
    {name: "database", path: "backend/database"},
    {name: "api", path: "backend/api"},
    {name: "builder", path: "builder"}
];

modules.map(module => {
    console.log(childProcess.execSync("tool build module --name " + module.name, {
        cwd: path.join(basePath, module.path)
    }).toString());
    console.log(childProcess.execSync("tool publish " + module.name).toString());
});