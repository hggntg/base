import { suite, test } from "mocha";
import { expect } from "chai";
import "./object.partial";

interface IOBJ {
    a: number;
    b: string,
    c: boolean;
    d: any;
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

let objB: any = {
    a: 11,
    b: "B",
    c: false
}

objB.d = objB;

let objC: any = {
    a: 12,
    b: "BB",
    c: true
}

objC.d = [objC];

suite("Object", () => {
    suite("#clone", () => {
        test("with simple object", () => {
           let result = Object.__base__clone<IOBJ>(obj);
           expect(JSON.__base__circularStringify(result)).eq(JSON.__base__circularStringify(obj)); 
           result.d.a = "1";
           expect(JSON.__base__circularStringify(result.d)).not.eq(JSON.__base__circularStringify(obj.d));
        });
        test("with complex object", () => {
            let result = Object.__base__clone<IOBJ>(objA);
            expect(JSON.__base__circularStringify(result)).eq(JSON.__base__circularStringify(objA));
            result.d = null;
            expect(JSON.__base__circularStringify(result)).not.eq(JSON.__base__circularStringify(objA)); 
        });
        test("with object has map", () => {
            let temp = Object.__base__clone<IOBJ>(obj);
            let d = new Map<string, number>();
            d.set("a", 1);
            d.set("b", 2);
            d.set("c", 3);
            temp.d = d;
            let result = Object.__base__clone<IOBJ>(temp);
            expect((result.d instanceof Map)).eq(true);
            expect(result.d).not.eq(d);
            let tempD = result.d as Map<any, any>;
            expect(tempD.get("a")).eq(1);
            expect(tempD.get("b")).eq(2);
            expect(tempD.get("c")).eq(3);
        });
        test("with object has circular field", () => {
            let temp = Object.__base__clone<IOBJ>(objB);
            expect(temp.a).eq(11);
            expect(temp.b).eq("B");
            expect(temp.c).eq(false);
            expect(temp.d).eq(temp);
        });
        test("with object has circular field in an array", () => {
            let temp = Object.__base__clone<IOBJ>(objC);
            expect(temp.a).eq(12);
            expect(temp.b).eq("BB");
            expect(temp.c).eq(true);
            expect(Array.isArray(temp.d)).eq(true);
            expect(temp.d[0]).eq(temp);
        });
    });

    suite("#replace", () => {
        test("with condition number", () => {
            let temp = Object.__base__clone<IOBJ>(obj);
            let result = Object.__base__replace<IOBJ>(temp, 1, "1");
            expect(result.a).eq("1");
            expect(result.d.a).eq("1");
        });
        test("with condition string", () => {
            let temp = Object.__base__clone<IOBJ>(obj);
            let result = Object.__base__replace<IOBJ>(temp, "b", 1);
            expect(result.b).eq(1);
        });
        test("with condition boolean", () => {
            let temp = Object.__base__clone<IOBJ>(obj);
            let result = Object.__base__replace<IOBJ>(temp, true, {});
            expect(JSON.__base__circularStringify(result.c)).eq(JSON.__base__circularStringify({}));
        });
        test("with condition object", () => {
            let temp = Object.__base__clone<IOBJ>(obj);
            let result = Object.__base__replace<IOBJ>(temp, { a: 1, b: 2 }, { a: 2, b: 1 });
            expect(JSON.__base__circularStringify(result.d)).eq(JSON.__base__circularStringify({ a: 2, b: 1 }));
        });
    });

    suite("#noMap", () => {
        test("with simple object has map", () => {
            let temp = Object.__base__clone<IOBJ>(obj);
            let d = new Map<string, number>();
            d.set("a", 1);
            d.set("b", 2);
            d.set("c", 3);
            temp.d = d;
            let result = Object.__base__flattenMap<IOBJ>(temp);
            expect((result.d instanceof Map)).eq(false);
            expect(result.d.a).eq(1);
            expect(result.d.b).eq(2);
            expect(result.d.c).eq(3);
        });
    })
});