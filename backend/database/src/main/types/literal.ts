import mongoose from "mongoose";

export default class Literal extends mongoose.SchemaType {
    private optionTypes: ({new(...args): any})[];
    cast(input) {
        this.optionTypes.map(optionType => {
            if(optionType.name === "Boolean" || optionType.name === "ObjectId" || optionType.name === "Date" || optionType.name === "Number" || optionType.name === "String"){
                if(input instanceof optionType){
                    return input;
                }
            }
        });
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