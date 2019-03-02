"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serve_1 = require("./serve");
var adduser_1 = require("./adduser");
(function () {
    commander.command("registry <action>")
        .action(function (action) {
        console.log(action);
        if (action === "serve") {
            serve_1.serveRegistry();
        }
        else if (action === "adduser") {
            adduser_1.addUser();
        }
    });
})();
