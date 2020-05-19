import mongoose from "mongoose";

export interface IDatabaseConfigProperty extends Partial<Omit<mongoose.ConnectionOptions, "dbname" | "auth">> {
    host: string;
    user?: string;
    password?: string;
    port: number;
    dbName: string;
}

export interface IDatabaseConfig<T = any> {
    buildConfig(): IResultTypeWrapper<T>;
}

export abstract class ADatabaseConfig<T = any> implements IDatabaseConfig<T>{
    protected rawConfig: IDatabaseConfigProperty;

    constructor(_rawConfig: IDatabaseConfigProperty) {
        this.rawConfig = _rawConfig;
    }

    abstract buildConfig(): IResultTypeWrapper<T>;
}

export interface IMongooseConfig {
    connectionString: string;
    options?: mongoose.ConnectionOptions;
}

export class DatabaseMongooseConfig extends ADatabaseConfig<IMongooseConfig> implements IDatabaseConfig<IMongooseConfig> {
    buildConfig(): IResultTypeWrapper<IMongooseConfig> {
        let parsedConfig: Partial<IMongooseConfig> = {};
        let configKeys = Object.keys(this.rawConfig);
        let connectionObject: {
            host: string;
            user: string;
            port: number;
            password: string;
            dbName: string;
        } = {} as any;
        configKeys.map((configKey) => {
            if (configKey === "host" || configKey === "user" || configKey === "password" || configKey === "dbName" || configKey === "port") {
                connectionObject[configKey] = this.rawConfig[configKey] as never;
                delete this.buildConfig[configKey];
            }
            else {
                if (!parsedConfig.options) parsedConfig.options = {};
                parsedConfig.options[configKey] = this.rawConfig[configKey];
            }
        });
        if (!connectionObject.port) {
            let e = handleError(new Error("Missing database port"));
            return {
                value: undefined,
                error: e
            }
        }
        if (!connectionObject.dbName) {
            let e = handleError(new Error("Missing database name"));
            return {
                value: undefined,
                error: e
            }
        }
        let connectionString = "mongodb://";
        if (connectionObject.user && connectionObject.password) {
            connectionString += `${connectionObject.user}:${connectionObject.password}@`;
        }
        connectionString += `${connectionObject.host}:${connectionObject.port}/${connectionObject.dbName}`;
        parsedConfig.connectionString = connectionString;
        if (!parsedConfig.options) parsedConfig.options = {};
        if (!parsedConfig.options.useNewUrlParser) parsedConfig.options.useNewUrlParser = true;
        if (!parsedConfig.options.useUnifiedTopology) parsedConfig.options.useUnifiedTopology = true;
        return {
            value: parsedConfig as IMongooseConfig,
            error: undefined
        }
    }
} 