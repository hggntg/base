import { defaultValue } from "../src/default-value";
import { makeATest } from "@base/test";

makeATest("Function defaultValue case 1: typeof input === type", function(){
    const wantToTest = [
       {type: "boolean", truthy: true, input: true},
       {type: "boolean", truthy: true, input: false},
       {type: "boolean", truthy: true, input: null},
       {type: "boolean", truthy: false, input: true},
       {type: "boolean", truthy: false, input: false},
       {type: "boolean", truthy: false, input: null},
       {type: "string", truthy: true, input: "string"},
       {type: "string", truthy: true, input: null},
       {type: "string", truthy: false, input: "string"},
       {type: "string", truthy: false, input: null},
       {type: "number", truthy: true, input: 1},
       {type: "number", truthy: true, input: 0},
       {type: "number", truthy: true, input: -1},
       {type: "number", truthy: true, input: 1.2},
       {type: "number", truthy: true, input: -1.2},
       {type: "number", truthy: false, input: 1},
       {type: "number", truthy: false, input: 0},
       {type: "number", truthy: false, input: -1},
       {type: "number", truthy: false, input: 1.2},
       {type: "number", truthy: false, input: -1.2},
       {type: "object", truthy: true, input: {test: "string"}},
       {type: "object", truthy: true, input: {}},
       {type: "object", truthy: false, input: {test: "string"}},
       {type: "object", truthy: false, input: {}},
       {type: "array", truthy: true, input: [0, 1]},
       {type: "array", truthy: true, input: []},
       {type: "array", truthy: false, input: [0, 1]},
       {type: "array", truthy: false, input: []}
    ];
    const length = wantToTest.length;
    for(let i = 0; i < length; i++){
        if(wantToTest[i].type === "boolean"){
            this.should.be.aBoolean(defaultValue(wantToTest[i].input, wantToTest[i].type as "boolean", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "string"){
            this.should.be.aString(defaultValue(wantToTest[i].input, wantToTest[i].type as "string", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "number"){
            this.should.be.aNumber(defaultValue(wantToTest[i].input, wantToTest[i].type as "number", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "object"){
            this.should.be.anObject(defaultValue(wantToTest[i].input, wantToTest[i].type as "object", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "array"){
            this.should.be.anArray(defaultValue(wantToTest[i].input, wantToTest[i].type as "array", wantToTest[i].truthy));
        }
    }
});

makeATest("Function defaultValue case 2: typeof input !== type", function(){
    const wantToTest = [
        {type: "boolean", truthy: true, input: "string"},
        {type: "boolean", truthy: false, input: "string"},
        {type: "string", truthy: true, input: true},
        {type: "string", truthy: false, input: false},
        {type: "number", truthy: true, input: "string"},
        {type: "number", truthy: true, input: true},
        {type: "number", truthy: true, input: false},
        {type: "number", truthy: false, input: "string"},
        {type: "number", truthy: false, input: true},
        {type: "number", truthy: false, input: false},
        {type: "object", truthy: true, input: "string"},
        {type: "object", truthy: true, input: []},
        {type: "object", truthy: false, input: "string"},
        {type: "object", truthy: false, input: []},
        {type: "array", truthy: true, input: true},
        {type: "array", truthy: true, input: {}},
        {type: "array", truthy: false, input: true},
        {type: "array", truthy: false, input: {}}

    ];
    const length = wantToTest.length;
    for(let i = 0; i < length; i++){
        if(wantToTest[i].type === "boolean"){
            this.should.be.aNull(defaultValue(wantToTest[i].input, wantToTest[i].type as "boolean", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "string"){
            this.should.be.aNull(defaultValue(wantToTest[i].input, wantToTest[i].type as "string", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "number"){
            this.should.be.aNull(defaultValue(wantToTest[i].input, wantToTest[i].type as "number", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "object"){
            this.should.be.aNull(defaultValue(wantToTest[i].input, wantToTest[i].type as "object", wantToTest[i].truthy));
        }
        else if(wantToTest[i].type === "array"){
            this.should.be.aNull(defaultValue(wantToTest[i].input, wantToTest[i].type as "array", wantToTest[i].truthy));
        }
    }
})