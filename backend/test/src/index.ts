import { Type } from "./type";
import assert, { doesNotReject } from "assert";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

function makeASuite(title, whatToDo): Mocha.Suite {
    return describe(title, whatToDo);
}

export type Assert = typeof assert;

class Be{
    static aString(input) {
        return Type.isString(input);
    }
    static aNumber(input) {
        return Type.isNumber(input);
    }
    static anObject(input) {
        return Type.isObject(input);
    }
    static anArray(input) {
        return Type.isArray(input);
    }
    static aBoolean(input) {
        return Type.isBoolean(input);
    }
    static anArrayOfString(input) {
        return Type.isArrayOfString(input);
    }
    static aNull(input){
        return Type.isNull(input);
    }
    static like(title: string, fn:(this:{assert: Assert}) => void)
    static like(title: string, parallel: boolean, fn: (this: {assert: Assert}) => Promise<void>)
    static like(title: string, arg0 : boolean | ((this:{assert: Assert}) => void), arg1?: (this:{assert: Assert}) => Promise<void>){
        let numOfArguments = arguments.length;
        if(numOfArguments === 2){
            return it(title, () => {
                (arg0 as (this: {assert: Assert}) => void).apply({assert: assert});
            });
        }
        else{
            return it(title, (done) => {
                (arg1.apply({assert: assert}) as Promise<void>).then(value => {
                    done();
                }).catch(e => {
                    done(e);
                });
            });
        }
    }
    
}

class Should{
    static be : typeof Be = Be;
}

class It{
    static should : typeof Should = Should;
}

export function makeATest(title, fn: (this: typeof It) => void){
    return describe(title, function(){
        fn.apply(It);
    });
}