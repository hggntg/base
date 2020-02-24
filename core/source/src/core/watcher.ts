import { EventEmitter } from "events";

if (!process.watcher) {
    process.watcher = {
        emit: function (events: "STOP", id: string) {
            (this.event as EventEmitter).emit("STOP", id);
        },
        init() {
            if (!this.isInit) {
                this.isInit = true;
                (this.event as EventEmitter).on("STOP", (id: string) => {
                    this.memberIds[id] = "stopped";
                    let stopped = true;
                    Object.values(this.memberIds).map(status => {
                        if (status === "active") {
                            stopped = false;
                        }
                    });
                    if (stopped) {
                        console.log("Kill this process.........");
                        process.exit(0);
                    }
                });
            }
        },
        joinFrom(id: string) {
            let keys = Object.keys(this.memberIds);
            if (!keys.includes(id)) {
                this.memberIds[id] = "active";
            }
        }
    }
    Object.defineProperty(process.watcher, "memberIds", {
        configurable: false,
        writable: true,
        value: {}
    });
    Object.defineProperty(process.watcher, "isInit", {
        configurable: false,
        writable: true,
        value: false
    })
    Object.defineProperty(process.watcher, "event", {
        configurable: false,
        writable: false,
        value: new EventEmitter()
    });
    process.watcher.init();
}