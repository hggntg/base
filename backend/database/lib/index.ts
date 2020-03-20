export const uiIndex = `
const express = require("express");
const path = require("path");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cookieParser = require('cookie-parser');
const port = 30000;

function route(socket){
    socket.on("get/module/list", function(){
        let data = [
            {name: "User", itemCounts: 100000, slug: 'user'},
            {name: "Product", itemCounts: 2000, slug: 'product'},
            {name: "User Attribute", itemCounts: 50000, slug: 'user-attribute'},
            {name: "Order", itemCounts: 30000, slug: 'order'},
            {name: "Order Item", itemCounts: 58903399, slug: 'order-item'},
            {name: "Product Attribute", itemCounts: 66890091, slug: 'product-attribute'}
        ]
        socket.emit("response/get/module/list:success", data);
    });
    socket.on("login", function(userData){
        if(userData.email && userData.password){
            if(userData.email !== "hggntg@gmail.com" || userData.password !== "admin123"){
                socket.emit("join:error", "Email or password is invalid");
            }
            else {
                let id = "THIS_WILL_BE_A_TOKEN";
                socket.emit("join:success", id);
            }
        }
        else {
            socket.emit("join:error", "Missing email or password");
        }
    });
    socket.on('disconnect', function(){
        console.log(\`\${this.id} disconnect from the server\`);
        unRoute(this);
    });
}

function off(socket, event){
    socket.off(event, function(){
        console.log(\`\${socket.id} off \${event}\`);
    })
}

function unRoute(socket){
    off(socket, "login");
    off(socket, "get/module/list");
}

let dataNamespace = io.of("/data");
dataNamespace.on('connection', function(socket){
    console.log(\`\${socket.id} connect to the server\`);
    route(socket);
});


app.use( 
    cookieParser(),
    (req, res, next) => {
        let token = req.cookies ? req.cookies.token : undefined;
        if(token){
            req.token = token;
        }
        next();
    }
);

app.use("/js", (req, res) => {
    let filePath = path.join(__dirname, req.url);
    res.sendFile(filePath);
});

app.use("/css", (req, res) => {
    let filePath = path.join(__dirname, req.url);
    res.sendFile(filePath);
});

app.get("/login", (req, res) => {
    let token = req.cookies ? req.cookies.token : undefined;
    if(token && token === "THIS_WILL_BE_A_TOKEN"){
        res.redirect("/");
    }
    else {
        let filePath = path.join(__dirname, "views", "login.html");
        res.sendFile(filePath);
    }
});

app.use((req, res, next) => {
    let token = req.cookies ? req.cookies.token : undefined;
    if(token && token === "THIS_WILL_BE_A_TOKEN"){
        next();
    }
    else {
        res.redirect("/login");
    }
});

app.get("/:module", (req, res) => {
    let token = req.cookies ? req.cookies.token : undefined;
    if(token && token === "THIS_WILL_BE_A_TOKEN"){
        let filePath = path.join(__dirname, "views", "list.html");
        res.sendFile(filePath);
    }
    else {
        res.redirect("/login");
    }
});

app.get("/:module/:id", (req, res) => {
    let token = req.cookies ? req.cookies.token : undefined;
    if(token && token === "THIS_WILL_BE_A_TOKEN"){
        let filePath = path.join(__dirname, "views", "detail.html");
        res.sendFile(filePath);
    }
    else {
        res.redirect("/login");
    }
});

app.get("/", (req, res) => {
    let token = req.cookies ? req.cookies.token : undefined;
    if(token && token === "THIS_WILL_BE_A_TOKEN"){
        let filePath = path.join(__dirname, "views", "home.html");
        res.sendFile(filePath);
    }
    else {
        res.redirect("/login");
    }
});

http.listen(port, () => console.log(\`Example app listening on port \${port}!\`));`