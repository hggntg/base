import mongoose, { SchemaType, Schema, Document } from "mongoose";

export default class Email extends SchemaType {
    cast(email: string) {
        if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
            throw new Error('Invalid email address')
        }
        return email;
    }
    constructor(path: string, options?: any){
        super(path, options, "Email");
    }
}