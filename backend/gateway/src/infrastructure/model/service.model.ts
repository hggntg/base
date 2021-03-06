import { TMethod } from "@app/infrastructure/model/internal";

export interface IServiceAction {
    path: string;
    description: string;
    method: TMethod;
    param: string[];
    query: string[];
    headers: string[];
    relatedServices: string[];
    body: string[];    
    response: string[];
    onFail: string;
}

export interface IService {
    hostname: string;
    ip: string;
    scheme: string;
    actions:{
        [key in string]: IServiceAction;
    };
}

export interface IServiceAPIBody {
    hostname: string;
    ip: string;
    scheme: string;
    actions: {
        [key in string]: IServiceAction;
    }
}

export class ServiceAction implements IServiceAction {
    @Property(String)
    path: string;
    @Property(String)
    description: string;
    @Property(String)
    method: TMethod;
    @Property(PropertyArray(String))
    param: string[];
    @Property(PropertyArray(String))
    query: string[];
    @Property(PropertyArray(String))
    headers: string[];
    @Property(PropertyArray(String))
    relatedServices: string[];
    @Property(PropertyArray(String))
    body: string[];
    @Property(PropertyArray(String))
    response: string[];
    @Property(String)
    onFail: string;
}   

export class Service implements IService {
    @Property(String)
    hostname: string;    
    @Property(String)
    ip: string;
    @Property(String)
    scheme: string;
    @Property(PropertyTypes.Any)
    actions: {
        [key in string]: IServiceAction;
    }
}