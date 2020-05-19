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

import { IDatabaseConfigProperty, DatabaseMongooseConfig, MongooseDatabaseConnection } from "@base/new-database";

let config: IDatabaseConfigProperty = {
    host: "localhost",
    dbName: "kindy",
    port: 27017,
    useNewUrlParser: true,
    authSource: "kindily"
}

let databaseConfig = new DatabaseMongooseConfig(config);

let databaseConnection = new MongooseDatabaseConnection();
databaseConnection.createConnection(databaseConfig).then(() => {
    console.log("ayooooooooooooooooooooooooooooooooO");
}).catch(e => {
    console.error(e);
});
    