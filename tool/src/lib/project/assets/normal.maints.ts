export const maints = `import { IApp, App, APP_SERVICE } from "@base/builder";
import { registerDependency, getDependency, extendClass } from "@base/class";
import path from "path";

interface IMain extends IApp{}

class Main extends App implements IMain{}

registerDependency<IMain>(APP_SERVICE, Main, false, true);

extendClass(Main, [App]);

const app: IMain = getDependency<IMain>(APP_SERVICE);

app.initValue({
    appName: "your-app-name",
    logTag: "your-log-tag"
});

let configPath: string = path.join(process.cwd(), ".env");
app.loadConfig(configPath);

export default app;`;