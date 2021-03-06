console.log("Hello I am base project");
console.log("I'm Hung from where?");

console.log(Type.compare("test", "string"));
console.log(Type.compare("test", "number"));

console.log(Type.compare(0, "string"));
console.log(Type.compare(0, "number"));

console.log(Type.compare(true, "boolean"));
console.log(Type.compare(false, "boolean"));
console.log(Type.compare(true, "string"));

console.log(Type.compare({}, "object"));
console.log(Type.compare(null, "object"));
console.log(Type.compare({}, "string"));

console.log(Type.compare(undefined, "void"));
console.log(Type.compare(undefined, "any"));

console.log(Type.compare([], "array"));
console.log(Type.compare([], "object"));

interface IA extends IBaseClass{
    name: string;
}

class A implements IA {
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    name: string;
    constructor(){
        this.name = "AAAAA";
    }
}
