import { IApp, App, APP_SERVICE } from "@base/builder";
import path from "path";

interface IMain extends IApp{}

class Main extends App implements IMain{}

registerDependency<IMain>(APP_SERVICE, Main, false, true);

extendClass(Main, App);

export const app: IMain = getDependency<IMain>(APP_SERVICE);

app.init({
    appName: "your-app-name",
    root: __dirname,
    aliases: {
        "app": __dirname
    }
});

let configPath: string = path.join(process.cwd(), ".env");
app.loadConfig(configPath);

app.start();
console.log("Hello I'm base project");