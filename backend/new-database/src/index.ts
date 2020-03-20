addAlias("@app", __dirname);
import mongoose from "mongoose";
import { BaseEntity } from "@app/main";

interface IPerson {
    name: string;
    age: number;
}

class Person extends BaseClass<IPerson> implements IPerson {
    @Property(String)
    name: string;    
    @Property(Number)
    age: number;
}

class PersonEntity extends BaseEntity<IPerson>{

}

let person = new Person();

let personEntity = new PersonEntity();

person.init({name: "Hung", age: 30});

personEntity.init({
    status: "draft",
    value: person
});

console.log(personEntity);