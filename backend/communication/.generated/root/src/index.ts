import "./core";
import "./declare";
addAlias("@app", __dirname);
export * from "@app/server";
export * from "@app/client";
export * from "@app/worker";
export * from "@app/main";
export * from "@app/interface";