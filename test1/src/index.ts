import { IPC } from "node-ipc";
let ipc = new IPC();
ipc.config.id = 'a-unique-process-name1';
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.serve(() => {
    let stop = false;
    ipc.server.on('a-unique-message-name', message => {
        console.log(message);
    });
    ipc.server.on("destroy", () => {
        console.log("destroy");
    });
    ipc.server.on("stop", () => {
        if (!stop) {
            stop = true;
            ipc.server.stop();
            ipc.disconnect('a-unique-process-name1');
            process.exit(0);
        }
    });
});
ipc.server.start();