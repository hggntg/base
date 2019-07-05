import "./core.ts";
import { Lib } from "./lib";
import { A, B } from "./model";

interface IBerforeTest extends IBaseClass{
    value: number;
}
Type.declare({"kind":"interface","name":"IBerforeTest","extends":[],"methods":[],"properties":[{"kind":"property","name":"value","optional":false,"type":null}]});
interface ITestClass extends IBaseClass{
    name: string;
    before: IBerforeTest;
}
Type.declare({"kind":"interface","name":"ITestClass","extends":[],"methods":[],"properties":[{"kind":"property","name":"name","optional":false,"type":null},{"kind":"property","name":"before","optional":false,"type":null}]});
class TestClass implements ITestClass{
    getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
    name: string;
    before: IBerforeTest;

    static getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
}
Type.declare({"kind":"class","name":"TestClass","constructors":[],"extend":null,"implements":[],"methods":[],"properties":[]});
class D implements IBaseClass{
    getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
    value: string;

    static getType(): IClassType {
        return Type.get(getClass(this).name, "class") as IClassType;
    }
}
Type.declare({"kind":"class","name":"D","constructors":[],"extend":null,"implements":[],"methods":[],"properties":[]});

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
