import mongoose from "mongoose";
import crypto from "crypto";

export default class Password extends mongoose.SchemaType {
    private secret: string;
    cast(password: string) {
        let hash = crypto.createHmac("sha256", this.secret).update(password).digest("base64");
        return hash;
    }
    compare(password: string, encoded: String) {
        let hash = crypto.createHmac("sha256", this.secret).update(password).digest("base64");
        return hash === encoded;
    }
    constructor(path: string, options?: any) {
        super(path, options, "Password");
        this.secret = options.secret || "secret";
    }
}