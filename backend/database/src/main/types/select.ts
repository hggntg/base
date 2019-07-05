import mongoose from "mongoose";

export default class Select extends mongoose.SchemaType{
    private options: any[];
    cast(selected: any){
        let checked = false;
        if(typeof selected === "number" || typeof selected === "string" || typeof selected === "boolean"){
            checked = this.options.indexOf(selected) >= 0 ? true : false;
        }
        else{
            checked = false;
        }
        if(!checked){
            throw new Error("Selected value is not in given options");
        }
        return selected
    }
    constructor(path: string, options?: any){
        super(path, options, "Select");
        this.options = options.options || [];
    }
}