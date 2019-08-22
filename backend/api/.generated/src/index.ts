import "./core";
import "./declare";
export * from "./interface";
export * from "./main/controller";
export * from "./main/server";
import { ResponseTemplate, HttpCode } from "./main/response";
import { IQueryParamInput } from "./interface";
import { Property } from "@base/class";
export {
    HttpCode,
    ResponseTemplate as Resp
}
export * from "./main/middleware";

export class QueryParamInput implements IQueryParamInput{
    @Property(Number)
    pageSize?: number;
    @Property(Number)
    pageIndex?: number;
    @Property(Object)
    sort?: any;
    @Property(Object)
    filter?: any;
    @Property(String)
    fields?: string;

    static getType(): IClassType {
        return Type.get("QueryParamInput", "class") as IClassType;
    }
}