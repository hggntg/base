import { getProperties, checkRequire } from "../main/property";

export function mapData<T>(ClassImp:{new() : T}, source: any): T{
    let properties = getProperties(ClassImp);
    let requires = checkRequire(ClassImp);
    let isValid = 1;
    let result = null;
    if (requires) {
        Object.keys(requires).map(key => {
            if (requires[key]) {
                isValid *= source[key] ? 1 : 0;
            }
            else {
                isValid *= 1;
            }
        });
    }
    if (isValid) {
        properties.map(property => {
            if (!result) {
                result = new ClassImp();
            }
            if(typeof source[property] === "object")
            {
                result[property] = Object.assign({}, source[property]);
            }
            else{
                result[property] = source[property];
            }
        });
    }
    return result as T;
}