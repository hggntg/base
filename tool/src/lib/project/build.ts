import fs from "fs";
import shell from "shelljs";
import { log } from "../../infrastructure/logger";
export function build(name: string, target?: string) {
    if(!target) target = "root";
    let cwd = process.cwd();
    shell.exec(`tool build module --name ${name} --src .generated/${target}`, { cwd: cwd });
    log("Build done....");
}