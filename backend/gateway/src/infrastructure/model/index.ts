import { TMethod } from "@app/infrastructure/model/internal";
import { IService, Service, IServiceAPIBody } from "@app/infrastructure/model/service.model";

interface IRegistryAPIBodySection {
    serviceName: string;
    service: IService;
}

export interface IRegistryAPIBody {
    serviceName: string;
    service: IServiceAPIBody;
}

interface IRegistryAPISection {
    path: string;
    method: TMethod;
    body: IRegistryAPIBodySection;
}

export interface IRegistryAPI {
    path: string;
    method: TMethod;
    body: IRegistryAPIBody;
}

interface IServiceRegistryAPISection {
    register: IRegistryAPISection;
}

export interface IServiceRegistryAPI {
    register: IRegistryAPI;
}

export interface IServiceRegistryAPIBody{
    scheme: "http" | "https";
    hostname: string;
    apis: IServiceRegistryAPI;
    publicKey: string;
    id: string;
    secret: string;
    name: string;
}

export interface IServiceRegistrySection {
    scheme: "http" | "https";
    hostname: string;
    apis: IServiceRegistryAPISection;
    publicKey: string;
    id: string;
    secret: string;
    name: string;
}

export class RegistryAPIBodySection implements IRegistryAPIBodySection {
    @Property(String)
    serviceName: string;    
    @Property(Service)
    service: IService;
}

class RegistryAPISection implements IRegistryAPISection {
    @Property(String)
    path: string;    
    @Property(String)
    method: TMethod;
    @Property(RegistryAPIBodySection)
    body: IRegistryAPIBodySection;
}

class ServiceRegistryAPISection implements IServiceRegistryAPISection {
    @Property(RegistryAPISection)
    register: IRegistryAPISection;
}

export class ServiceRegistrySection implements IServiceRegistrySection {
    @Property(String)
    scheme: "http" | "https";
    @Property(String)
    hostname: string;    
    @Property(ServiceRegistryAPISection)
    apis: IServiceRegistryAPISection;
    @Property(String)
    publicKey: string;
    @Property(String)
    id: string;
    @Property(String)
    secret: string;
    @Property(String)
    name: string;
}

export * from "@app/infrastructure/model/registry.model";
export * from "@app/infrastructure/model/service.model";