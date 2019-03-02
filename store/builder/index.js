"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
__export(require("./domain"));
process.on('unhandledRejection', function (reason, promise) {
    console.log(promise);
    console.log('Unhandled Rejection at:', reason.stack || reason);
});
