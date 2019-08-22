import { PassThrough } from "stream";
import ReadLine from "readline";

let pass = new PassThrough();
process.stdin.pipe(pass);
function writeAndClear(msg){
    process.stdout.write("Progress: " + msg + "%");
    ReadLine.cursorTo(process.stdout, 0, 0);
}
function clearAndWrite(msg){
    ReadLine.clearLine(process.stdout, 0);
    process.stdout.write("Progress: " + msg + "%");
}
pass.on("data", (chunk: Buffer) => {
    let increment = Number(chunk.toString());
    if (increment === 100) {
        writeAndClear(increment.toString())
        setTimeout(() => {
            process.exit(0);
        }, 1);
    }
    else {
        clearAndWrite(increment.toString());        
    }
});