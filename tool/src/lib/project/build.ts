import fs from "fs";
import shell from "shelljs";
import { log } from "../../infrastructure/logger";
export function build(name: string) {
    let cwd = process.cwd();
    shell.exec(`tool build module --name ${name} --src .generated`, { cwd: cwd });
    log("Build done....");
}