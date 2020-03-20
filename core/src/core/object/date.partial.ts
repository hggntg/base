// =================================================== Date ==============================================
if ("undefined" === typeof Date.__base__fromJSON) {
    Date.__base__fromJSON = function (input: string): Date {
        input = input.replace(/[(Date)\(\)]/g, "");
        return new Date(input);
    }
}
if ("undefined" === typeof Date.prototype.__base__toJSON) {
    Date.prototype.__base__toJSON = function(): string {
        return `Date(${this.toISOString()})`;
    }
}

if ("undefined" === typeof Date.prototype.__base__clone) {
    Date.prototype.__base__clone = function(): Date{
        return new Date(this);
    }
}