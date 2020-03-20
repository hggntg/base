/// <reference types="./typings" />
/// <reference types="mongoose" />

import mongoose = require("mongoose");

declare module "mongoose" {
    namespace Types {
        interface ObjectId extends IExtendBaseClass<ObjectId>{}
    }
}
interface IObjectIdConstructor {
    __base__fromString(input: string): mongoose.Types.ObjectId;
}