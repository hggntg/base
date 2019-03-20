import mongoose from "mongoose";
import { IBaseEntity } from "@base/interfaces";
export declare abstract class BaseEntity implements IBaseEntity {
    getInstance(): mongoose.Model<mongoose.Document>;
    constructor();
}
export * from "./decorator";
export * from "./entity-schema";
