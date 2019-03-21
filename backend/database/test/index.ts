global["app"] = {};

import { Entity, BaseEntity, Field } from "../src";
import mongoose from "mongoose";

interface ITest{
    test: string;
}

@Entity<ITest>("test", {
     
}, function(){
    this.pre("init", function(next){
        console.log("init");
        next();
    }).pre("save", function(next){
        console.log("save");
        next();
    });
    this.plugin(function a1123(){
        
    });
    this.pre("update", function(next){
        console.log("update");
        next();
    });
})
class Test extends BaseEntity implements ITest{
    test: string;
}

let test = new Test();