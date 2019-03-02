import express from "express";
import { IController } from "./main/controller";
import { UnitOfWork } from "@base/interfaces";

export interface IExtendApi{
    server?: express.Express;
    startServer?(port: number, unitOfWorkInstance: UnitOfWork, controllers: {[key: string]: { new(unitOfWorkInstance: UnitOfWork) : IController} }): Promise<boolean>;
}
