import { Property, getDependency } from "@base/class";
import { IController } from "../../../interface"
import { Server } from "../server.decorator";
import { SERVER_ZONE_KEY } from "../../../shared/constant";
import { CONTROLLER_SERVICE } from "../../../main/controller";

export function ControllerProperty<T extends IController>(classImp: { new(): T }) {
    return function (target: any, propertyKey: string) {
        Property(Object)(target, propertyKey);
        let apiZoneMetadata = Server.getAPIZoneMetadata(target);
        if(!apiZoneMetadata){
            apiZoneMetadata = {
                classes: {},
                context: null
            }
        }
        apiZoneMetadata.classes[propertyKey] = classImp;
        defineMetadata(SERVER_ZONE_KEY, apiZoneMetadata, getClass(target));
        let isDeleted = delete target[propertyKey];
        if(isDeleted){
            let newVal = getDependency<IController>(CONTROLLER_SERVICE, classImp.name);
            Object.defineProperty(target, propertyKey, {
                configurable: true,
                enumerable: true,
                get(){
                    return newVal;
                },
                set(_val: IController){
                    newVal = _val;
                }
            })
        }
    }
}