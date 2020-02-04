import mongoose from "mongoose";

export default class Literal extends mongoose.SchemaType {
    private optionTypes: ({new(...args): any})[];
    cast(input) {
        let length = this.optionTypes.length;
        for(let i = 0; i < length; i++){
            let optionType = this.optionTypes[i];
            if(optionType.name === "Boolean"|| optionType.name === "Number" || optionType.name === "String" || optionType.name === "Object" || optionType.name === "Array"){
                if(optionType.name === "Array"){
                    if(Array.isArray(input)){
                        return input;
                    }
                }
                else {
                    if(typeof input === optionType.name.toLowerCase()){
                        return input;
                    }
                }
            }
            else if(optionType.name === "ObjectId" || optionType.name === "Date"){
                if(input instanceof optionType){
                    return input;
                }
            }
        }
        throw new Error("Invalid literal type");
    }
    constructor(path: string, options?: any) {
        if (options.optionTypes) {
            super(path, options, "Literal");
            this.optionTypes = options.optionTypes;
        }
        else {
            throw new Error("Missing struct for schema with custom type");
        }
    }
}