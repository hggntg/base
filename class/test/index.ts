// import { Property, Class, use } from "@base-class[property]";
// import { ICustom, CUSTOM_SERVICE, DUSTOM_SERVICE, IDustom, BUSTOM_SERVICE, IBustom } from "./custom";
// import { Type } from "@base-class[utilities.type]";
// import { getDependency } from "@base-class[utilities.class]";
// import { IInterfaceType, IFunctionType } from "@base-class[interface]";

// interface IRecord {
//     first: string;
//     second: number;
//     checked: boolean;
//     log(): void;
// }

// const RECORD_SERVICE = "IRecord";

// let IRecordLogMetadata: IFunctionType = {
//     name: "IRecord.log",
//     kind: "Function",
//     signatures: [
//         {
//             length: 0,
//             construct: false,
//             rest: false,
//             returns: Type.Void,
//             parameters: []
//         }
//     ]
// }


// let IRecordMetadata: IInterfaceType = {
//     name: "IRecord",
//     kind: "interface",
//     members: {
//         first: Type.String,
//         second: Type.Number,
//         checked: Type.Boolean,
//         log: IRecordLogMetadata
//     }
// }

// Type.declare(IRecordMetadata);

// @Class(RECORD_SERVICE, true, true)
// class Record implements IRecord {
//     @Property(String, { required: true })
//     first: string;

//     @Property(Number, { required: true })
//     second: number;

//     @Property(Boolean, { required: true })
//     checked: boolean;

//     constructor(
//         @use(CUSTOM_SERVICE, "Custom") public custom: ICustom,
//         @use(DUSTOM_SERVICE) public dustom: IDustom,
//         @use(BUSTOM_SERVICE) public bustom: IBustom
//     ) {
//         this.custom.initValue({ id: "G", value: 1000 });
//         this.dustom.initValue({ id: "ADG", value: 500, name: "Hung"});
//         this.bustom.initValue({ id: "BUN", value: 750, name: "Phan", slug: "Sluggggggggg" });
//     }

//     log() {
//         console.log(this.custom.id + " : " + this.custom.value);
//         console.log(this.dustom.id + " : " + this.dustom.value + " : " + this.dustom.name);
//         console.log(this.bustom.id + " : " + this.bustom.name + " : " + this.bustom.value + " : " + this.bustom.slug);
//     }
// }

// let record: IRecord = getDependency<IRecord>(RECORD_SERVICE);

// record.log();