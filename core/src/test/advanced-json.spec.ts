import { suite, test} from "mocha";
import { expect } from "chai";
import "../core";
import "../core/json.partial";
import "../core/object";

interface IOBJ {
    a: number;
    b: number;
    c: string;
    d: Date;
    e: IOBJ;
}

class OBJ {
    a: number;
    b: number;
    c: string;
    d: Date;
    e: IOBJ;

    constructor(input: Partial<IOBJ>){
        this.a = input.a;
        this.b = input.b;
        this.c = input.c;
        this.d = input.d;
    }
}

let obj: any = new OBJ({
    a: 1,
    b: 2,
    c: "c",
    d: new Date()
});

obj.e = {
    a: obj
};

obj.e.b = obj.e;


suite("JSON with DateObject", () => {
    suite("#circularStringify", () => {
        test("with simple object", () => {
            try{
                let temp = Object.__base__clone<IOBJ>(obj);
                let result = JSON.__base__circularStringify(temp);
                expect(result).contain(`"d":` + obj.d.__base__toJSON());
            }
            catch(e){
                throw e;
            }
        });
    });
});
