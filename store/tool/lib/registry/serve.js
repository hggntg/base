"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var shelljs_1 = __importDefault(require("shelljs"));
var child_process_1 = __importDefault(require("child_process"));
function serveRegistry() {
    shelljs_1.default.exec("docker -v", { silent: true }, function (code, stderr, stdout) {
        if (code === 0) {
            shelljs_1.default.exec("docker image ls verdaccio/verdaccio", { silent: true }, function (code, stderr, stdout) {
                if (code === 0) {
                    var list = stderr.split(/\n/g);
                    list.splice(list.length - 1, 1);
                    var listLength = list.length;
                    var lastList = [];
                    for (var i = 1; i < listLength; i++) {
                        var cols = list[i].split(/\s+/g);
                        lastList.push(cols[0]);
                    }
                    if (lastList.length === 0) {
                        shelljs_1.default.exec("docker pull verdaccio/verdaccio", function (code, stderr, stdout) {
                            if (code === 0) {
                                child_process_1.default.spawnSync("docker", "run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio".split(" "), {
                                    stdio: "inherit"
                                });
                            }
                            else {
                                throw new Error(stdout);
                            }
                        });
                    }
                    else {
                        child_process_1.default.spawnSync("docker", "run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio".split(" "), {
                            stdio: "inherit"
                        });
                    }
                }
                else {
                    throw new Error(stdout);
                }
            });
        }
        else {
            throw new Error(stdout);
        }
    });
}
exports.serveRegistry = serveRegistry;
