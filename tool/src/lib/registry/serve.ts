import shell from "shelljs";
import childProcess from "child_process";

export function serveRegistry(){
    shell.exec("docker -v", {silent: true} , function (code, stderr, stdout) {
        if(code === 0){
            shell.exec("docker image ls verdaccio/verdaccio", {silent: true},  function (code, stderr, stdout) {
                if(code === 0){
                    let list = stderr.split(/\n/g);
                    list.splice(list.length - 1, 1);
                    let listLength = list.length;
                    let lastList = [];
                    for(let i = 1; i < listLength; i++){
                        let cols = list[i].split(/\s+/g);
                        lastList.push(cols[0]);
                    }
                    if(lastList.length === 0){
                        shell.exec("docker pull verdaccio/verdaccio", function(code, stderr, stdout){
                            if(code === 0){
                                childProcess.spawnSync("docker", "run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio".split(" "), {
                                    stdio: "inherit"
                                });
                            }
                            else{
                                throw new Error(stdout);
                            }
                        });
                    }
                    else{
                        childProcess.spawnSync("docker", "run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio".split(" "), {
                            stdio: "inherit"
                        });
                    }
                }
                else{
                    throw new Error(stdout);
                }
            });
        }
        else{
            throw new Error(stdout);
        }
    });
}