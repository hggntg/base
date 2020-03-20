export function defaultValue(input: any, type: "boolean" | "string" | "number" | "object" | "array", truthy: boolean = true) {
    if (input === null) {
        if (type === "boolean") {
            return truthy;
        }
        else if (type === "string") {
            return "";
        }
        else if (type === "number") {
            return truthy ? 1 : 0;
        }
        else if (type === "object") {
            return truthy ? {} : null;
        }
    }
    else {
        if(type === "array" && Array.isArray(input)){
            return input;
        }
        else if (typeof input === type && !Array.isArray(input)) {
            return input;
        }
        else {
            return null;
        }
    }
}