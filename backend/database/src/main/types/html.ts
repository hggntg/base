import { SchemaType } from "mongoose";
import sanitizeHtml from "sanitize-html";

let allowedTags = sanitizeHtml.defaults.allowedTags;
allowedTags.map((allowedTag, index, arr) => {
    if(allowedTag === "iframe") arr.splice(index, 1);
});
sanitizeHtml.defaults.allowedTags = allowedTags;

export default class Html extends SchemaType {
    cast(input: string) {
        input = sanitizeHtml(input);
        return input;
    }
    constructor(path: string, options?: any){
        super(path, options, "Html");
    }
}