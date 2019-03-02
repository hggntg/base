import fs from "fs";
import path from "path";
const toolPath = path.join(__dirname, "../tool.json");
export function getConfig(key): string{
    let configJSON = fs.readFileSync(toolPath).toString().replace(/[\n\t\r]/g, "").replace(/\s\s/g, "");
    let config = JSON.parse(configJSON);
    return config[key];
}
export function getRootBasePath(): string{
    return getConfig("basePath");
}