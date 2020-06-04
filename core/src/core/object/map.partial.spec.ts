import { suite, test } from "mocha";
import { expect } from "chai";
import "./map.partial";

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


suite("Map", () => {
    suite("#fromObject", () => {
        test("with simple object", () => {
            let result = Map.__base__fromObject<IOBJ>(obj);
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
            let temp = Map.__base__fromObject<IOBJ>(obj);
            let result = temp.__base__convertToObject<IOBJ>();
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
            let result = temp.__base__clone();
            expect(result).not.eq(temp);
            expect(result.get("a")).eq(temp.get("a"));
            expect(result.get("b")).eq(temp.get("b"));
            expect(result.get("c")).eq(temp.get("c"));
        });
    });
});