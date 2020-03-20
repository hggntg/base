import {  returnSum, returnBoolean } from "./index";
import { expect } from "chai";
import {  suite, test } from "mocha";

suite("Second function", function(){
    test("need to return boolean", function(){
        expect(returnBoolean()).to.be.a("boolean");
    });
});

suite("Third function", function(){
    test("need to return 10", function(){
        expect(returnSum(5, 6)).to.be.eq(10);
    })
})