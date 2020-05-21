import { SchemaType } from "mongoose";
import sanitizeHtml from "sanitize-html";

let allowedTags = sanitizeHtml.defaults.allowedTags;
let allowedAttributes = sanitizeHtml.defaults.allowedAttributes;
allowedTags.map((allowedTag, index, arr) => {
    if(allowedTag === "iframe") arr.splice(index, 1);
});
allowedTags.push("img", "figure", "span");
allowedAttributes["*"] = ['href', 'alt', 'class', 'id', 'style', 'width', 'height', 'src', 'disabled'];
sanitizeHtml.defaults.allowedTags = allowedTags;
sanitizeHtml.defaults.allowedAttributes = allowedAttributes;

export default class Html extends SchemaType {
    cast(input: string) {
        input = sanitizeHtml(input);
        return input;
    }
    constructor(path: string, options?: any){
        super(path, options, "Html");
    }
}