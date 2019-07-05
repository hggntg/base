import * as CustomTypes  from "./main/types";
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

export class QueryInput implements IQueryInput{
    @Property(Number)
    pageSize: number;
    
    @Property(Number)
    pageIndex: number;
}