/// <reference types="node" />
import { IApp, APP_SERVICE } from "../.generated/src";
import { getDependency } from "@base/class";
import path from "path";
const app: IApp = getDependency(APP_SERVICE);
let configPath: string = path.join(process.cwd(), "test/.env");
app.initValue({ appName: "test-app", logTag: "test-tag"});
app.loadConfig(configPath);
app.start();