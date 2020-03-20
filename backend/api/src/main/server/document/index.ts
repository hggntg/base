import { OpenAPIV3 } from "openapi-types";
import { SERVER_DOCUMENT_KEY } from "@app/shared/constant";
import { IAPIDocumentSection, IControllerDocumentSection, IRouteDocumentSection } from "@app/interface";

export function getAPIDocumentMetadata(): OpenAPIV3.Document {
    let classImp = getClass(global);
    let apiDocumentMetadata: OpenAPIV3.Document = getMetadata(SERVER_DOCUMENT_KEY, classImp) || {};
    return apiDocumentMetadata;
}

export function setAPIDocumentMetadata(input: Partial<IAPIDocumentSection & IControllerDocumentSection & IRouteDocumentSection>){
    let classImp = getClass(global);
    let apiDocumentMetadata: OpenAPIV3.Document = getAPIDocumentMetadata();
    if(input.openapi) apiDocumentMetadata.openapi = input.openapi;
    if(input.info) apiDocumentMetadata.info = input.info;
    if(input.tag){
        if(!apiDocumentMetadata.tags) apiDocumentMetadata.tags = [];
        apiDocumentMetadata.tags.push(input.tag);
    }
    if(input.servers) apiDocumentMetadata.servers = input.servers;
    if(input.path){
        if(!apiDocumentMetadata.paths) apiDocumentMetadata.paths = {};
        apiDocumentMetadata.paths[input.name] = input.path;
    }
    if(input.components){
        if(!apiDocumentMetadata.components) apiDocumentMetadata.components = input.components;
        else {
            let rootKeys = Object.keys(apiDocumentMetadata.components);
            let inputKeys = Object.keys(input.components);
            inputKeys.map(inputKey => {
                if(!rootKeys.includes(inputKey)){
                    apiDocumentMetadata.components[inputKey] = input.components[inputKey];
                }
            });
        }
    }
    defineMetadata(SERVER_DOCUMENT_KEY, apiDocumentMetadata, classImp);
}