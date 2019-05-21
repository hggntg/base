import { Namespace } from "@base/utilities/namespace";
import { INamespace } from "@base-interfaces/utilities";

export class CustomWrap{
    private source: INamespace;
    constructor(){
        this.source = Namespace.create("custom-wrap");
    }

    connect(callback){
        let conn = this.source.get("connection");
        setTimeout(() => {
            if(conn){
                callback(conn);
            }
            else{
                conn = "Hello I'm still here";
                this.source.set("connection", conn);
                callback(conn);
            }
        }, 150);
    }

    disconnect(){
        console.log(this.source);
    }
}