const ipc = require('node-ipc');
let argsMinimist = require('minimist')(process.argv);

ipc.config.id = 'a-unique-process-name2';
ipc.config.retry = 1500;
ipc.config.silent = true;
const server = 'a-unique-process-name1';
ipc.connectTo(server, () => {
    ipc.of[server].on('connect', () => {
        if (!argsMinimist || !argsMinimist.params) {
            let error = {
                name: "Missing pararms",
                message: "You need to pass params",
                stack: JSON.stringify(argsMinimist)
            }
            let errorString = JSON.stringify(error);
            process.stderr.write(Buffer.from(errorString));
            ipc.disconnect(server);
            setTimeout(() => {
                process.exit(0);
            }, 1000);
        }
        else {
            ipc.of[server].emit('a-unique-message-name', "The message we send");
            setTimeout(() => {
                let result = {
                    id: 1,
                    valueSend: "The message we send",
                    time: 1000,
                    pararms: argsMinimist.params
                };
                let resultJsonString = JSON.stringify(result);
                process.stdout.write(Buffer.from(resultJsonString));
                // process.stderr.write()
                ipc.disconnect(server);
                process.exit(0);
            }, 1000);
        }
    });
});

function finish(){

}