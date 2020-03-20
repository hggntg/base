const express = require("express");
const fs = require("fs");
const path = require("path");
const { Transform } = require('stream');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const uuid = require("uuid");
const cookieParser = require('cookie-parser');
const port = 3000;

// const mapData = function(data){
//     return new Transform({
//         transform(chunk, encoding, callback) {
//             let str = chunk.toString();
//             let parsedData = undefined;
//             if(typeof data === "string"){
//                 parsedData = data;
//             }
//             else if(typeof data === "number"){
//                 parsedData = data.toString();
//             }
//             else if(typeof data === "boolean"){
//                 parsedData = data.toString();
//             }
//             else if(Array.isArray(data)){
//                 parsedData = JSON.stringify(data);
//             }
//             else if(typeof data === "object"){
//                 parsedData = JSON.stringify(data);
//             }
//             if(parsedData){
//                 // parsedData = Buffer.from(parsedData, "utf-8").toString("base64");
//                 this.push(str.replace('"<%data%>"', parsedData));
//             }
//             else {
//                 this.push(str.replace('"<%data%>"',  "undefined"));
//             }
//             callback();
//         }
//     });
// }

// let sockets = {};
// let dataNamespace = io.of("/data");
// dataNamespace.on('connection', function(socket){
//     let id = socket.id.replace("data/#", "");
//     console.log(`${id} connect to the server`);
//     if(!sockets[id]) sockets[id] = socket;
//     socket.emit("join", id);
//     socket.on('disconnect', function(){
//         let innerId = this.id.replace("data/#", "");
//         delete sockets[innerId];
//         console.log(`${this.id} disconnect from the server`);
//     });
// });


// app.use( 
//     cookieParser(),
//     (req, res, next) => {
//         let reqId = req.cookies ? req.cookies.reqId : undefined;
//         if(reqId){
//             req.reqId = reqId;
//         }
//         next();
//     }
// )

// app.get("/login", (req, res) => {
//     let reqId = req.cookies ? req.cookies.reqId : undefined;
//     res.cookie("module", "login");
//     if(reqId){
//         res.redirect("/");
//     }
//     else {
//         let filePath = path.join(__dirname, "dist", "login", "index.html");
//         let reader = fs.createReadStream(filePath, { autoClose: true });
//         reader.pipe(res);
//     }
// });

// app.use("/js", (req, res) => {
//     let moduleName = req.cookies ? req.cookies.module : undefined;
//     console.log(`In ${moduleName}`);
//     if(moduleName){
//         let filePath = path.join(__dirname, "dist", moduleName, "js", req.url);
//         fs.exists(filePath, (exists) => {
//             if(exists){
//                 let reader = fs.createReadStream(filePath);
//                 reader.pipe(res);
//             }
//             else {
//                 res.status(404).end();
//             }
//         });
//     }
//     else {
//         res.status(404).end();
//     }
// });
// app.use("/css",  (req, res) => {
//     let moduleName = req.cookies ? req.cookies.module : undefined;
//     console.log(`In ${moduleName}`);
//     if(moduleName){
//         let filePath = path.join(__dirname, "dist", moduleName, "css", req.url);
//         fs.exists(filePath, (exists) => {
//             if(exists){
//                 let reader = fs.createReadStream(filePath);
//                 reader.pipe(res);
//             }
//             else {
//                 res.status(404).end();
//             }
//         });
//     }
//     else {
//         res.status(404).end();
//     }
// });
// app.use("/img",  (req, res) => {
//     let moduleName = req.cookies ? req.cookies.module : undefined;
//     console.log(`In ${moduleName}`);
//     if(moduleName){
//         let filePath = path.join(__dirname, "dist", moduleName, "img", req.url);
//         fs.exists(filePath, (exists) => {
//             if(exists){
//                 let reader = fs.createReadStream(filePath);
//                 reader.pipe(res);
//             }
//             else {
//                 res.status(404).end();
//             }
//         });
//     }
//     else {
//         res.status(404).end();
//     }
// });
// app.use("/favicon.ico",  (req, res) => {
//     let moduleName = req.cookies ? req.cookies.module : undefined;
//     console.log(`In ${moduleName}`);
//     if(moduleName){
//         let filePath = path.join(__dirname, "dist", moduleName, req.url);
//         fs.exists(filePath, (exists) => {
//             if(exists){
//                 let reader = fs.createReadStream(filePath);
//                 reader.pipe(res);
//             }
//             else {
//                 res.status(404).end();
//             }
//         });
//     }
//     else {
//         res.status(404).end();
//     }
// });


// app.use((req, res, next) => {
//     let reqId = req.cookies ? req.cookies.reqId : undefined;
//     if(reqId){
//         res.cookie("module", "home");
//         next();
//     }
//     else {
//         res.redirect("/login");
//     }
// });

// app.get('/', (req, res) => {
//     let reqId = req.cookies ? req.cookies.reqId : undefined;
//     if(reqId){
//         let filePath = path.join(__dirname, "dist", "home", "index.html");
//         let reader = fs.createReadStream(filePath, { autoClose: true });
//         let data = [
//             { id: 1, first_name: 'Jesse', last_name: 'Simmons', date: '2016/10/15 13:43:27', gender: 'Male' },
//             { id: 2, first_name: 'John', last_name: 'Jacobs', date: '2016/12/15 06:00:53', gender: 'Male' },
//             { id: 3, first_name: 'Tina', last_name: 'Gilbert', date: '2016/04/26 06:26:28', gender: 'Female' },
//             { id: 4, first_name: 'Clarence', last_name: 'Flores', date: '2016/04/10 10:28:46', gender: 'Male' },
//             { id: 5, first_name: 'Anne', last_name: 'Lee', date: '2016/12/06 14:38:38', gender: 'Female' }
//         ];
//         reader.pipe(res).once("finish", () => {
//             dataNamespace.emit(`data:${reqId}`, data);
//         });
//     }
//     else {
//         res.redirect("/login");
//     }
// });
app.use("/js", (req, res) => {
    let filePath = path.join(__dirname, "dist", req.url);
    res.sendFile(filePath);
});

app.use("/", (req, res) => {
    let filePath = path.join(__dirname, "dist", "demo.html");
    res.sendFile(filePath);
});

http.listen(port, () => console.log(`Example app listening on port ${port}!`));