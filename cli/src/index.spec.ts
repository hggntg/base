import { returnString } from "./index";
import { expect } from "chai";
import { describe, it } from "mocha";

describe("First function", function(){
    it("need to return a string", function(){
        expect(returnString()).to.be.a("string");
    });
});