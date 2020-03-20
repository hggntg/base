import {    
    IUnitOfWork 
} from "@base/database";

import { App } from "@base/builder";

export interface IExtendDatabase{
    db: IUnitOfWork;
}

export class ExtendDatabase extends App implements IExtendDatabase{
    db: IUnitOfWork;    
}