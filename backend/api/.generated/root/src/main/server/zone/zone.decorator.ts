import { IZone } from "@app/interface";
import { Property, getDependency } from "@base/class";
import { Server } from "@app/main/server/server.decorator";
import { SERVER_API_KEY } from "@app/shared/constant";

export function Zone<T extends IZone>(classImp: { new(): T }) {
    return function (target: any, propertyKey: string) {
        Property(Object)(target, propertyKey);
        let apiMetadata = Server.getAPIMetadata(target);
        if(!apiMetadata){
            apiMetadata = {
                classes: {},
                options: null
            }
        }
        apiMetadata.classes[propertyKey] = classImp;
        defineMetadata(SERVER_API_KEY, apiMetadata, getClass(target));
        let isDeleted = delete target[propertyKey];
        if(isDeleted){
            let newVal = getDependency<IZone>(Server.ZONE_SERVICE, classImp.name);
            
            Object.defineProperty(target, propertyKey, {
                configurable: true,
                enumerable: true,
                get(){
                    return newVal;
                },
                set(_val: IZone){
                    newVal = _val;
                }
            })
        }
    }
}