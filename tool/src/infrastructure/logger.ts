import { clearLine, cursorTo } from "readline";
function echo(message: string, type: "normal" | "error" = "normal"){
    if(message !== "\n"){
        message = message.replace(/[\n\n]/g, "\n");
        if(type === "normal"){
            process.stdout.write(message);
            process.stdout.write("\n");
        }
        else{
            process.stderr.write(message);
            process.stderr.write("\n");
        }
    }
}
export function log(input: any, type: "normal" | "error" = "normal"){
    if(typeof input === "string"){
        echo(input, type);
    }
    else if(typeof input === "boolean" || typeof input === "number" || typeof input === "function" || typeof input === "symbol"){
        echo(input.toString(), type);
    }
    else if(typeof input === "undefined"){
        echo("undefined", type);
    }
    else{
        if(Array.isArray(input) && !(input instanceof Error)){
            echo(JSON.stringify(input), type);
        }
        else{
            echo(input.message, "error");
            echo(input.stack, "error");
        }
    }
}

export function clear(){
    cursorTo(process.stdout, 0);
    clearLine(process.stdout, -1);
    cursorTo(process.stdout, 0);
    clearLine(process.stdout, 0);
}

