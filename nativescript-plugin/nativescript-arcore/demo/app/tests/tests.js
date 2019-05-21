var Arcore = require("nativescript-arcore").Arcore;
var arcore = new Arcore();

describe("greet function", function() {
    it("exists", function() {
        expect(arcore.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(arcore.greet()).toEqual("Hello, NS");
    });
});