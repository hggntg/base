// import { Property, Class } from "@base-class[property]";
// import { Type } from "@base-class[utilities.type]";
// import { IInterfaceType, IBaseClass } from "@base-class[interface]";

// export const CUSTOM_SERVICE = "ICustom";

// export interface ICustom extends IBaseClass<ICustom> {
//     id: string;
//     value: number;
// }
// let ICustomMetadata: IInterfaceType = {
//     name: "ICustom",
//     kind: "interface",
//     members: {
//         id: Type.String,
//         value: Type.Number
//     }
// }
// Type.declare(ICustomMetadata);


// @Class(CUSTOM_SERVICE, true, true)
// export class Custom implements ICustom {
//     initValue(input: Partial<ICustom>): void {
//         this.id = input.id;
//         this.value = input.value;
//     }

//     @Property(String)
//     id: string;

//     @Property(Number)
//     value: number;
// }

// @Class(CUSTOM_SERVICE, true)
// export class CustomA implements ICustom {
//     initValue(input: Partial<ICustom>): void {
//         this.id = input.id;
//         this.value = input.value;
//     }

//     @Property(String)
//     id: string;

//     @Property(Number)
//     value: number;
// }

// export const DUSTOM_SERVICE = "IDustom";

// export interface IDustom extends IBaseClass<IDustom> {
//     id: string;
//     value: number;
//     name: string;
// }
// let IDustomMetadata: IInterfaceType = {
//     name: "IDustom",
//     kind: "interface",
//     members: {
//         id: Type.String,
//         value: Type.Number,
//         name: Type.String
//     }
// }
// Type.declare(IDustomMetadata);

// @Class(DUSTOM_SERVICE, true, true)
// export class Dustom implements IDustom {
//     initValue(input: Partial<IDustom>): void {
//         this.id = input.id;
//         this.value = input.value;
//         this.name = input.name;
//     }

//     @Property(String)
//     id: string;

//     @Property(Number)
//     value: number;

//     @Property(String)
//     name: string;
// }

// export const BUSTOM_SERVICE = "IBustom";

// type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

// type IMigrateBaseClass<T, K> = Omit<T, "initValue"> & IBaseClass<K>;

// export interface IBustom extends IMigrateBaseClass<IDustom, IBustom>{
//     slug: string;
// }

// let IBustomMetadata: IInterfaceType = {
//     name: "IBustom",
//     kind: "interface",
//     members: IDustomMetadata.members,
//     extends: [IDustomMetadata]
// }

// Type.declare(IBustomMetadata);

// @Class(BUSTOM_SERVICE, true, true)
// export class Bustom implements IBustom {
//     initValue(input: Partial<IBustom>): void {
//         this.id = input.id;
//         this.value = input.value;
//         this.name = input.name;
//         this.slug = input.slug;
//     }

//     @Property(String)
//     id: string;

//     @Property(Number)
//     value: number;

//     @Property(String)
//     name: string;

//     @Property(String)
//     slug: string;
// }