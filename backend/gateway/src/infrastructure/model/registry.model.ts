import { IService, Service, IServiceAPIBody } from "@app/infrastructure/model/service.model";

export interface IRegistry {
    serviceName: string;
    services: IService[];
}

export interface IRegistryAPIBody {
    serviceName: string;
    services: IServiceAPIBody[];
}

export class Registry implements IRegistry{
    @Property(String)
    serviceName: string;
    @Property(PropertyArray(Service))    
    services: IService[];
}
