import fs from "fs";
import shell from "shelljs";
import { log } from "../../infrastructure/logger";
import { join } from "path";
import rimraf, { Options } from "rimraf";

function clean(path, options: Options, retry = 0, cb) {
    if (retry > 0) {
        log("Retry remove build folder " + retry + " time(s).");
    }
    rimraf(path, options, (err) => {
        if (err) {
            if (retry === 10) {
                cb(err, null);
            }
            else {
                clean(path, options, retry + 1, cb);
            }
        }
        else {
            cb(null, true);
        }
    });
}

export function compile() {
    let cwd = process.cwd();
    let buildFolder = join(cwd, "build");
    let tsconfigPath = join(cwd, ".generated/tsconfig.json");
    let packagePath = join(cwd, "package.json");
    let envPath = join(cwd, ".generated/.env");
    let dockerPath = join(cwd, "docker");
    if (!fs.existsSync(buildFolder)) {
        fs.mkdirSync(buildFolder);
        fs.copyFileSync(envPath, join(buildFolder, ".env"));
        fs.copyFileSync(packagePath, join(buildFolder, "package.json"));

        if (fs.existsSync(dockerPath)) {
            fs.copyFileSync(join(dockerPath, ".dockerignore"), join(buildFolder, ".dockerignore"));
            fs.copyFileSync(join(dockerPath, "docker-compose.yml"), join(buildFolder, "docker-compose.yml"));
            fs.copyFileSync(join(dockerPath, "Dockerfile"), join(buildFolder, "Dockerfile"));
        }

        let output = shell.exec(`tsc -p ${tsconfigPath} --declaration false --outDir ${buildFolder}/src`);
        if (output.stderr) {
            log(output.stderr, "error");
        }
        else {
            log(output.stdout);
            log("Build done....");
        }
    }
    else {
        log("clearing build folder " + buildFolder);
        clean(buildFolder, { maxBusyTries: 10 }, 0, (err, status) => {
            if(err){
                log(err, "error");
            }
            try{
                fs.mkdirSync(buildFolder);
            }
            catch(e){
                log(e, "error");
            }

            
            fs.copyFileSync(envPath, join(buildFolder, ".env"));
            fs.copyFileSync(packagePath, join(buildFolder, "package.json"));

            if (fs.existsSync(dockerPath)) {
                fs.copyFileSync(join(dockerPath, ".dockerignore"), join(buildFolder, ".dockerignore"));
                fs.copyFileSync(join(dockerPath, "docker-compose.yml"), join(buildFolder, "docker-compose.yml"));
                fs.copyFileSync(join(dockerPath, "Dockerfile"), join(buildFolder, "Dockerfile"));
            }

            let output = shell.exec(`tsc -p ${tsconfigPath} --declaration false --outDir ${buildFolder}/src`);
            if (output.stderr) {
                log(output.stderr, "error");
            }
            else {
                log(output.stdout);
                log("Build done....");
            }
        });
    }
}