import { SchemaType } from "mongoose";

export default class Json extends SchemaType {
    cast(input: string) {
        if(!input){
            throw new Error("Invalid json");
        }
        else {
            input = input.replace(/\n/g, " ").replace(/\s\s/g, " ");
            try{
                let jsonObject = JSON.parse(input);
                input = JSON.stringify(jsonObject);
            }
            catch(e){
                throw e;
            }
        }
        return input;
    }
    constructor(path: string, options?: any){
        super(path, options, "Json");
    }
}