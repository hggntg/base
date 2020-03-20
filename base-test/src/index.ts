import { Lib } from "./lib";
import { A, B } from "./model";

interface IBerforeTest extends IBaseClass{
    value: number;
}
interface ITestClass extends IBaseClass{
    name: string;
    before: IBerforeTest;
}
class TestClass implements ITestClass{
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    name: string;
    before: IBerforeTest;
}
class D implements IBaseClass{
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    value: string;
}

console.log(TestClass.getType());
console.log(D.getType());

import express from "express"

let app = express();

app.use("/post", (req, res) => {
    res.send("POSTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT");
});

const server = app.listen(3000, ()=>{
    console.log("ayoooooooooooooooooooooooooooooooooooooooooooo");
});

process.on("SIGINT", () => {
    server.close();
});
