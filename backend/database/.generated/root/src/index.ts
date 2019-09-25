import "./core";
import "./declare";
addAlias("@app", __dirname);
import { CustomTypes } from "@app/main/types";
import mongoose from "mongoose";

Object.values(CustomTypes).map((type) => {
    mongoose.Schema.Types[type.name] = type;
});
import { IQueryInput } from "@app/interface";
import { Property } from "@base/class";
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
        this.where = eval(mappings.where) || undefined;
        return input;
    }

    static getType(): IClassType {
        return Type.get("QueryInput", "class") as IClassType;
    }
}