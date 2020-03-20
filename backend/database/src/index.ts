addAlias("@app", __dirname);
import { CustomTypes } from "@app/main/types";
import mongoose, { mongo } from "mongoose";

const mongooseObjectIdPrototype: IExtendBaseClass<mongoose.Types.ObjectId> = mongoose.Types.ObjectId.prototype;

if("undefined" === typeof mongooseObjectIdPrototype.__base__clone){
    mongooseObjectIdPrototype.__base__clone = function(this: mongoose.Types.ObjectId){
        return mongoose.Types.ObjectId(this as any) as any;
    }
}
if("undefined" === typeof mongooseObjectIdPrototype.__base__toJSON){
    mongooseObjectIdPrototype.__base__toJSON = function(this: mongoose.Types.ObjectId): string {
        return this.toString();
    }
}
// TO DO: Add type for ObjectId
const ObjectIdConstructor: any  = mongoose.Types.ObjectId;
if("undefined" === typeof ObjectIdConstructor.__base__fromString){
    ObjectIdConstructor.__base__fromString = function(input: string) {
        let tempValue = mongoose.Types.ObjectId(input);
        if(tempValue.equals(input)) return tempValue;
        return null;
    }
}


Object.values(CustomTypes).map((type) => {
    mongoose.Schema.Types[type.name] = type;
});


import { IQueryInput } from "@app/interface";
export { CustomTypes };
export * from "@app/main/database-context";
export * from "@app/main/entity";
export * from "@app/main/repository";
export * from "@app/main/unit-of-work";
export * from "@app/infrastructure/constant";
export * from "@app/infrastructure/utilities";
export * from "@app/interface";

export class QueryInput implements IQueryInput {
    @Property(Number)
    skip: number;

    @Property(Number)
    limit: number;

    @Property(String)
    select: string;

    @Property(Object)
    sort: any;

    @Property(Object)
    where: any;

    private static mappings: {
        skip: string,
        limit: string,
        select: string,
        sort: string,
        where: string
    };

    static mapQueryInput(input: {
        skip: string,
        limit: string,
        select: string,
        sort: string,
        where: string
    }) {
        if (!this.mappings) {
            this.mappings = input;
        }
    }

    input(source: any): IQueryInput {
        if (!QueryInput.mappings) {
            QueryInput.mappings = {
                skip: "(source.pageIndex || 0) * (source.pageSize || 10)",
                limit: "(source.pageSize || 10)",
                select: "source.fields",
                sort: "source.sort",
                where: "source.filter"
            }
        }
        let input: IQueryInput = {};
        let mappings = QueryInput.mappings;
        this.skip = eval(mappings.skip);
        this.limit = eval(mappings.limit);
        this.select = eval(mappings.select) || undefined;
        this.sort = eval(mappings.sort) || undefined;
        this.where = JSON.parse(eval(mappings.where) || {}) || undefined;
        return input;
    }
}