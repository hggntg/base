addAlias("@app", __dirname);
export * from "@app/interface";
export * from "@app/main/controller";
export * from "@app/main/server";
import { ResponseTemplate, HttpCode } from "@app/main/response";
import { IQueryParamInput } from "@app/interface";
import { Property } from "@base/class";
export {
    HttpCode,
    ResponseTemplate as Resp
}
export * from "@app/main/middleware";

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
}