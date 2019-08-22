import { CustomTypes } from "./main/types";
import mongoose from "mongoose";

Object.values(CustomTypes).map((type) => {
    mongoose.Schema.Types[type.name] = type;
});
import { IQueryInput } from "./interface";
import { Property } from "@base/class";
export { CustomTypes };
export * from "./main/database-context";
export * from "./main/entity";
export * from "./main/repository";
export * from "./main/unit-of-work";
export * from "./infrastructure/constant";
export * from "./infrastructure/utilities";
export * from "./interface";

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
        this.where = eval(mappings.where) || undefined;
        return input;
    }
}