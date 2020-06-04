import { suite, test} from "mocha";
import { expect } from "chai";
import "./json.partial";

interface IOBJ {
    a: number;
    b: number;
    c: string;
    d: any;
}

class OBJ {
    a: number;
    b: number;
    c: string;
    d: any;

    constructor(input: Partial<IOBJ>){
        this.a = input.a;
        this.b = input.b;
        this.c = input.c;
    }
}

let obj: any = new OBJ({
    a: 1,
    b: 2,
    c: "c"
})

let objA: any = new OBJ({
    a: 2,
    b: 3,
    c: "C"
});

let objB = {
    a: 1,
    b: "b",
    c: true,
    d: {
        a: obj,
        b: obj,
        c: obj
    }
}

let objC: any = {
    a: 11,
    b: "BB",
    c: true
}

objC.d = {
    a: objC,
    b : {
        a: objC
    }
};

objC.d.b.b = objC.d.b;

let objD: any = {
    a: 0,
    b: "B",
    c: false
}

objD.d = [objD];

let objE: any = {
    a: 2,
    b: "BC",
    c: true
}
objE.d = {
    e: {
        ce: objE    
    },
    f: {
        ce: objE
    },
}

objE.d.e.d = objE.d;
objE.d.e.f = objE.d.f; 

objE.d.f.d = objE.d;
objE.d.f.e = objE.d.e;


let objF: any = {
    a : 5,
    b: "D",
    c: false,
    d: function(a, b){
        console.log(a, b);
    }
}


suite("JSON", () => {
    suite("#circularStringify", () => {
        test("with simple object", () => {
            try{
                let temp = Object.__base__clone<IOBJ>(obj);
                temp.d = temp;
                let result = JSON.__base__circularStringify(temp);
                expect(result).contain(`"d":"Symbol(Circular)[root]"`);
            }
            catch(e){
                throw e;
            }
        });
        test("with complex object", () => {
            try {
                let temp = Object.__base__clone<IOBJ>(obj);
                let tempA = Object.__base__clone<IOBJ>(objA);
                temp.d = tempA;
                tempA.d = tempA;
                let result = JSON.__base__circularStringify(temp);
                expect(result).contain(`"d":"Symbol(Circular)[root.d]"`);
            }
            catch(e){
                throw e;
            }
        });
        test("with more complex object", () => {
            try {
                let tempB = Object.__base__clone<IOBJ>(objB as any);
                let result = JSON.__base__circularStringify(tempB);
                expect(result).not.contain("Symbol(Circular)");
            }
            catch(e){
                throw e;
            }
        });
        test("with object has circular", () => {
            try {
                let tempC = Object.__base__clone<IOBJ>(objC as any);
                let result = JSON.__base__circularStringify(tempC);
                expect(result).contain(`"d":{"a":"Symbol(Circular)[root]","b":{"a":"Symbol(Circular)[root]","b":"Symbol(Circular)[root.d.b]"}}}`);
            }
            catch(e){
                throw e;
            }
        });
        test("with object has circular in array", () => {
            try {
                let tempD = Object.__base__clone<IOBJ>(objD as any);
                let result = JSON.__base__circularStringify(tempD);
                expect(result).contain(`"d":["Symbol(Circular)[root]"]`);
            }
            catch(e){
                throw e;
            }
        });
        test("with object has complex circular", () => {
            try {
                let tempE = Object.__base__clone<IOBJ>(objE as any);
                let result = JSON.__base__circularStringify(tempE);
                expect(result).contain(`"d":"Symbol(Circular)[root.d]","f":"Symbol(Circular)[root.d.f]"},"f":{"ce":"Symbol(Circular)[root]","d":"Symbol(Circular)[root.d]","e":"Symbol(Circular)[root.d.e]"}}`);
            }
            catch(e){
                throw e;
            }
        });
        test("with object has function", () => {
            try {
                let tempF = Object.__base__clone<IOBJ>(objF as any);
                let result = JSON.__base__circularStringify(tempF);
                expect(result).contain(`"d":{}`);
            }
            catch(e) {
                throw e;
            }
        });
    });

    suite("#circularParse", () => {
        test("with simple json", () => {
            try {
                let temp = Object.__base__clone<IOBJ>(obj);
                let tempA = Object.__base__clone<IOBJ>(objA);
                temp.d = tempA;
                tempA.d = temp;
                let jsonString = JSON.__base__circularStringify(temp);
                let result = JSON.__base__circularParse<IOBJ>(jsonString);
                expect(JSON.__base__circularStringify(result.d.d)).eq(JSON.__base__circularStringify(result));
            }
            catch(e){
                throw e;
            }
        });
        test("with complex json", () => {
            try{
                let tempB = Object.__base__clone<IOBJ>(objB as any);
                let jsonString = JSON.__base__circularStringify(tempB);
                let result = JSON.__base__circularParse<IOBJ>(jsonString);
                expect(JSON.__base__circularStringify(result.d.a)).eq(JSON.__base__circularStringify(obj));
                expect(JSON.__base__circularStringify(result.d.b)).eq(JSON.__base__circularStringify(obj));
                expect(JSON.__base__circularStringify(result.d.c)).eq(JSON.__base__circularStringify(obj));
            }
            catch(e){
                throw e;
            }
        });
        test("with object has circular", () => {
            try {
                let tempC = Object.__base__clone<IOBJ>(objC as any);
                let jsonString = JSON.__base__circularStringify(tempC);
                let result = JSON.__base__circularParse<IOBJ>(jsonString);
                expect(JSON.__base__circularStringify(result.d.a)).eq(JSON.__base__circularStringify(objC));
                expect(JSON.__base__circularStringify(result.d.b.a)).eq(JSON.__base__circularStringify(objC));
                expect(JSON.__base__circularStringify(result.d.b.b)).eq(JSON.__base__circularStringify(objC.d.b));
            }
            catch(e){
                throw e;
            }
        });
        test("with json has circular in array", () => {
            try {
                let tempD = Object.__base__clone<IOBJ>(objD as any);
                let jsonString = JSON.__base__circularStringify(tempD);
                let result = JSON.__base__circularParse<IOBJ>(jsonString);
                expect(JSON.__base__circularStringify(result.d[0])).eq(JSON.__base__circularStringify(objD));
            }
            catch(e){
                throw e;
            }
        });
        test("with json has complex circular", () => {
            try {
                let tempE = Object.__base__clone<IOBJ>(objE as any);
                let jsonString = JSON.__base__circularStringify(tempE);
                let result = JSON.__base__circularParse<IOBJ>(jsonString);

                expect(JSON.__base__circularStringify(result.d.e.ce)).eq(JSON.__base__circularStringify(objE));
                expect(JSON.__base__circularStringify(result.d.e.d)).eq(JSON.__base__circularStringify(objE.d));
                expect(JSON.__base__circularStringify(result.d.e.f.ce)).eq(JSON.__base__circularStringify(objE));
                expect(JSON.__base__circularStringify(result.d.e.f.d)).eq(JSON.__base__circularStringify(objE.d));
                expect(JSON.__base__circularStringify(result.d.e.f.e)).eq(JSON.__base__circularStringify(objE.d.e.f.e));
                
                expect(JSON.__base__circularStringify(result.d.f.ce)).eq(JSON.__base__circularStringify(objE));
                expect(JSON.__base__circularStringify(result.d.f.d)).eq(JSON.__base__circularStringify(objE.d));
                expect(JSON.__base__circularStringify(result.d.f.e.ce)).eq(JSON.__base__circularStringify(objE));
                expect(JSON.__base__circularStringify(result.d.f.e.d)).eq(JSON.__base__circularStringify(objE.d));
                expect(JSON.__base__circularStringify(result.d.f.e.f)).eq(JSON.__base__circularStringify(objE.d.f.e.f));
            }
            catch(e){
                throw e;
            }
        });
        test("with json has function", () => {
            try {
                let tempF = Object.__base__clone<IOBJ>(objF as any);
                let jsonString = JSON.__base__circularStringify(tempF);
                let result = JSON.__base__circularParse<IOBJ>(jsonString);
                expect(typeof result.d).eq("object");
                expect(Object.values(result.d).length).eq(0);
            }
            catch(e) {
                throw e;
            }
        });
    })
});