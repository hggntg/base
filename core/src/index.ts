import "reflect-metadata";
import "./core";

if(typeof global["process-watch-log"] === "undefined") {
    global["process-watch-log"] = true;
    process.once("exit", (code: number) => {
        if(code === 1111){
            process.stdout.write("╔══════════════════════════════════════════════════════════════╗\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║           App shutdown with error has level 'RED'            ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("╚══════════════════════════════════════════════════════════════╝\n");
        }
        else {
            let errorString = `App shutdown with error has code  ${code}`;
            let space = "              ";
            let codeString = code.toString();
            let spaceLength = space.length;
            let odd = (codeString.length % 2 !== 0);
            let leftSpaceLength = odd ? spaceLength - Math.floor(codeString.length / 2) - 1 : spaceLength - Math.floor(codeString.length / 2);
            let rightSpaceLength = spaceLength - Math.floor(codeString.length / 2);
            errorString = space.substring(0, leftSpaceLength) + errorString + space.substring(0,  rightSpaceLength);
            process.stdout.write("╔══════════════════════════════════════════════════════════════╗\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write(`║${errorString}║\n`);
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("║                                                              ║\n");
            process.stdout.write("╚══════════════════════════════════════════════════════════════╝\n");
        }
    }).on("uncaughtException", (err) => {
        console.error(err);
        handleError(err as Error, ErrorLevel.RED);
    }).on("unhandledRejection", (err) => {
        console.error(err);
        handleError(err as Error, ErrorLevel.RED);
    }).on("app-error", (err) => {
        console.error(err);
        let error = err as IBaseError;
        if(error.level === "red"){
            process.exit(1111);
        }
    });
}

// class Test {
//     @Property(String, {required: false})
//     a: string;
//     @Property(Number, {required: false})
//     b: number;
//     @Property(Date, {required: true})
//     c: Date;
//     @Property(PropertyArray(String), {required: true})
//     d: Array<String>;
// }

// class Test1 {
//     @Property(Test, {required: true})
//     a: Test;
//     @Property(PropertyMap(PropertyMap(Number)))
//     b: Map<string, Map<string, number>>;
//     // @Property(PropertyMap(Number))
//     // b: Map<string, number>;
// }

// let t = new Test();
// let value = {a: "a", b: 15, c: new Date(), d: ["a", "b", "c", "d", "e"]};
// let data = mapData<Test>(Test, value);
// if(data.error){
//     handleError(data.error, ErrorLevel.RED);
// }
// else {
//     t = data.value;
// }

// console.debug(t);

// let t1 = new Test1();
// let s = {a: t, b: new Map()};
// let temp = new Map();
// temp.set("a", 0).set("b", 1).set("c", 2).set("d", 3);
// s.b.set("a", temp).set("b", temp).set("c", temp);
// // s.b.set("a", 0).set("b", 1).set("c", 2).set("d", 3);
// let data1 = mapData<Test1>(Test1, s);
// if(data1.error){
//     handleError(data1.error, ErrorLevel.RED);
// }
// else {
//     t1 = data1.value;
// }
// console.debug(t1);
// let JSONT1 = JSON.__base__circularStringify(t1);
// console.debug(JSONT1);
// let ObjT1 = JSON.__base__circularParse(JSONT1);
// console.debug(ObjT1);

// =======================================================
// =======================================================
// =======================================================
// =======================================================

// class Test {
//     @Property(String)
//     a: string;
//     @Property(Number)
//     b: number;
// }


// @DynamicProperty(PropertyTypes.Any, {required: true})
// class Test1 {
//     [key: string]: any;
// }


// let t = new Test();
// t.a = "a";
// t.b = 0;

// let t1 = new Test1();
// let value = {a: "a", b: 0, c: false};
// let data = mapData<Test1>(Test1, value);
// if(data.error) handleError(data.error, ErrorLevel.RED);
// else t1 = data.value;
// console.log(t1);