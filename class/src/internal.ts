export type PropertyTypeValue = {new(...args: any[]): any};
export type PropertyType = {type: "single" | "list" | "literal", value: PropertyTypeValue | PropertyTypeValue[]};