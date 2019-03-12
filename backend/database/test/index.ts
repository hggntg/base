global["app"] = {};

import { Entity, BaseEntity } from "../src";
import mongoose from "mongoose";

@Entity("test", {
     
}, function(){
    this.pre("init", (next) => {
        console.log("init");
        next();
    }).pre("save", (next) => {
        console.log("save");
        next();
    });

    this.pre("update", (next) => {
        console.log("update");
        next();
    });
})
class Test extends BaseEntity{

}

let test = new Test();