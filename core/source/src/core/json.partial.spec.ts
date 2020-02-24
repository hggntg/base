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

suite("JSON", () => {
    suite("#circularStringify", () => {
        test("with simple object", () => {
            try{
                let temp = Object.clone<IOBJ>(obj);
                temp.d = temp;
                let result = JSON.circularStringify(temp);
                expect(result).contain(`"d":"Symbol(Circular)[root]"`);
            }
            catch(e){
                throw e;
            }
        });
        test("with complex object", () => {
            try {
                let temp = Object.clone<IOBJ>(obj);
                let tempA = Object.clone<IOBJ>(objA);
                temp.d = tempA;
                tempA.d = tempA;
                let result = JSON.circularStringify(temp);
                expect(result).contain(`"d":"Symbol(Circular)[root.d]"`);
            }
            catch(e){
                throw e;
            }
        });
        test("with more complex object", () => {
            try {
                let tempB = Object.clone<IOBJ>(objB);
                let result = JSON.circularStringify(tempB);
                expect(result).not.contain("Symbol(Circular)");
            }
            catch(e){
                throw e;
            }
        });
    });

    suite("#circularParse", () => {
        test("with simple json", () => {
            try {
                let temp = Object.clone<IOBJ>(obj);
                let tempA = Object.clone<IOBJ>(objA);
                temp.d = tempA;
                tempA.d = temp;
                let jsonString = JSON.circularStringify(temp);
                let result = JSON.circularParse<IOBJ>(jsonString);
                expect(JSON.circularStringify(result.d.d)).eq(JSON.circularStringify(result));
            }
            catch(e){
                throw e;
            }
        });
        test("with complex json", () => {
            try{
                let tempB = Object.clone<IOBJ>(objB);
                let jsonString = JSON.circularStringify(tempB);
                let result = JSON.circularParse<IOBJ>(jsonString);
                expect(JSON.circularStringify(result.d.a)).eq(JSON.circularStringify(obj));
                expect(JSON.circularStringify(result.d.b)).eq(JSON.circularStringify(obj));
                expect(JSON.circularStringify(result.d.c)).eq(JSON.circularStringify(obj));
            }
            catch(e){
                throw e;
            }
        })
    })
});