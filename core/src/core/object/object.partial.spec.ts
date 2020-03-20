import { suite, test } from "mocha";
import { expect } from "chai";
import "./object.partial";

interface IOBJ {
    a: number;
    b: string,
    c: boolean;
    d: any;
}

class OBJ extends BaseClass<IOBJ> implements IOBJ, IBaseClass<IOBJ> {
    toJSON(): string {
        throw new Error("Method not implemented.");
    }
    fromJSON(input: string): IOBJ {
        throw new Error("Method not implemented.");
    }
    valueAt<K>(key: string): K {
        throw new Error("Method not implemented.");
    }
    setAt(key: string, value: any) {
        throw new Error("Method not implemented.");
    }
    flattenMap(): IOBJ {
        throw new Error("Method not implemented.");
    }
    a: number;
    b: string;
    c: boolean;
    d: any;
    clone(){
        let newObj = new OBJ();
        newObj.init({
            a: this.a,
            b: this.b,
            c: this.c,
            d: Object.__base.clone(this.d)
        });
        return newObj;
    }
}

let obj = {
    a: 1,
    b: "b",
    c: true,
    d: {
        a: 1,
        b: 2
    }
}

let objA = {
    a: 1,
    b: "b",
    c: true,
    d: {
        a: obj,
        b: obj,
        c: obj
    }
}



suite("Object", () => {
    suite("#clone", () => {
        test("with simple object", () => {
           let result = Object.__base.clone<IOBJ>(obj);
           expect(JSON.__base.circularStringify(result)).eq(JSON.__base.circularStringify(obj)); 
           result.d.a = "1";
           expect(JSON.__base.circularStringify(result.d)).not.eq(JSON.__base.circularStringify(obj.d));
        });
        test("with complex object", () => {
            let result = Object.__base.clone<IOBJ>(objA);
            expect(JSON.__base.circularStringify(result)).eq(JSON.__base.circularStringify(objA));
            result.d = null;
            expect(JSON.__base.circularStringify(result)).not.eq(JSON.__base.circularStringify(objA)); 
        });
        test("with object has map", () => {
            let temp = Object.__base.clone<IOBJ>(obj);
            let d = new Map<string, number>();
            d.set("a", 1);
            d.set("b", 2);
            d.set("c", 3);
            temp.d = d;
            let result = Object.__base.clone<IOBJ>(temp);
            expect((result.d instanceof Map)).eq(true);
            expect(result.d).not.eq(d);
            let tempD = result.d as Map<any, any>;
            expect(tempD.get("a")).eq(1);
            expect(tempD.get("b")).eq(2);
            expect(tempD.get("c")).eq(3);
        });
        test("with class", () => {
            let temp = new OBJ();
            temp.init({
                a: 5,
                b: "B",
                c: false,
                d: {
                    a: 1,
                    b: new OBJ()
                }
            });
            temp.d.b.init({
                a: 6,
                b: "C",
                c: true
            });
            let result = Object.__base.clone<IOBJ>(temp);
            expect((result instanceof OBJ)).eq(true);
            expect((result.d.b instanceof OBJ)).eq(true);
            expect(result).not.eq(temp);
            expect(result.d).not.eq(temp.d);
            expect(result.d.b).not.eq(temp.d.b);
        });
    });

    suite("#replace", () => {
        test("with condition number", () => {
            let temp = Object.__base.clone<IOBJ>(obj);
            let result = Object.__base.replace<IOBJ>(temp, 1, "1");
            expect(result.a).eq("1");
            expect(result.d.a).eq("1");
        });
        test("with condition string", () => {
            let temp = Object.__base.clone<IOBJ>(obj);
            let result = Object.__base.replace<IOBJ>(temp, "b", 1);
            expect(result.b).eq(1);
        });
        test("with condition boolean", () => {
            let temp = Object.__base.clone<IOBJ>(obj);
            let result = Object.__base.replace<IOBJ>(temp, true, {});
            expect(JSON.__base.circularStringify(result.c)).eq(JSON.__base.circularStringify({}));
        });
        test("with condition object", () => {
            let temp = Object.__base.clone<IOBJ>(obj);
            let result = Object.__base.replace<IOBJ>(temp, { a: 1, b: 2 }, { a: 2, b: 1 });
            expect(JSON.__base.circularStringify(result.d)).eq(JSON.__base.circularStringify({ a: 2, b: 1 }));
        });
    });

    suite("#noMap", () => {
        test("with simple object has map", () => {
            let temp = Object.__base.clone<IOBJ>(obj);
            let d = new Map<string, number>();
            d.set("a", 1);
            d.set("b", 2);
            d.set("c", 3);
            temp.d = d;
            let result = Object.__base.flattenMap<IOBJ>(temp);
            expect((result.d instanceof Map)).eq(false);
            expect(result.d.a).eq(1);
            expect(result.d.b).eq(2);
            expect(result.d.c).eq(3);
        });
    })
});

suite("Map", () => {
    suite("#fromObject", () => {
        test("with simple object", () => {
            let result = Map.__base.fromObject<IOBJ>(obj);
            expect(result.get("a")).eq(1);
            expect(result.get("b")).eq("b");
            expect(result.get("c")).eq(true);
            let d = result.get("d");
            expect(d.a).eq(1);
            expect(d.b).eq(2);
        });
    });

    suite("#convertToObject", () => {
        test("with simple map", () => {
            let temp = Map.__base.fromObject<IOBJ>(obj);
            let result = temp.__base.convertToObject<IOBJ>();
            expect(result.a).eq(1);
            expect(result.b).eq("b");
            expect(result.c).eq(true);
            expect(result.d.a).eq(1);
            expect(result.d.b).eq(2);
        });
    });

    suite("#clone", () => {
        test("with simple map", () => {
            let temp = new Map();
            temp.set("a", 1);
            temp.set("b", 2);
            temp.set("c", 3);
            let result = temp.__base.clone();
            expect(result).not.eq(temp);
            expect(result.get("a")).eq(temp.get("a"));
            expect(result.get("b")).eq(temp.get("b"));
            expect(result.get("c")).eq(temp.get("c"));
        });
    });
});