addAlias("@app", __dirname);

import Server from "socket.io";

const server = Server(3000, {
    path: "/",
    serveClient: false
});

server.on("connect", (socket) => {
    
}).on("connection", (socket) => {
    socket.on("disconnect", () => {
        
    });
});
