addAlias("@app", __dirname);
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
export * from "@app/interface";
export * from "@app/domain";

// const app = getDependency<IApp>(APP_SERVICE) ;
// system.log(app);