import { getProperties } from "./class";

export function mapData<T>(ClassImp: { new(): T }, source: any): T {
    let properties = getProperties(ClassImp);
    let isValid = 1;
    let result = null;
    let missingFields = [];
    properties.map(property => {
        if (property.required === false || (property.required && source[property.name])) {
            isValid *= 1;
        }
        else {
            missingFields.push(property.name);
            isValid *= 0;
        }
        if (isValid) {
            if (!result) {
                result = new ClassImp();
            }
            if (Array.isArray(source[property.name])) {
                result[property.name] = source[property.name].slice(0);
            }
            else if (typeof source[property.name] === "object") {
                result[property.name] = Object.assign({}, source[property.name]);
            }
            else {
                result[property.name] = source[property.name];
            }
        }
    });
    if (isValid) {
        return result as T;
    }
    else {
        throw new Error("Missing fields " + missingFields.join(", "));
    }
}