/// <reference types="mocha" />
import assert from "assert";
export declare type Assert = typeof assert;
declare class Be {
    static aString(input: any): Mocha.Test;
    static aNumber(input: any): Mocha.Test;
    static anObject(input: any): Mocha.Test;
    static anArray(input: any): Mocha.Test;
    static aBoolean(input: any): Mocha.Test;
    static anArrayOfString(input: any): Mocha.Test;
    static aNull(input: any): Mocha.Test;
    static like(title: string, fn: (this: {
        assert: Assert;
    }) => void): any;
    static like(title: string, parallel: boolean, fn: (this: {
        assert: Assert;
    }) => Promise<void>): any;
}
declare class Should {
    static be: typeof Be;
}
declare class It {
    static should: typeof Should;
}
export declare function makeATest(title: any, fn: (this: typeof It) => void): Mocha.Suite;
export {};
