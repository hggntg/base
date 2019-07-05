import { IProperty } from "../../interface";
import { PROPERTIES_KEY } from "../../shared/constant";

export function Property(type, options?: {
    required?: boolean
}) {
    return (target: object, propertyKey: string) => {
        let columns: IProperty[] = getMetadata(PROPERTIES_KEY, target) || [];
        columns.push({ name: propertyKey, required: (options && options.required) ? true : false });
        defineMetadata(PROPERTIES_KEY, columns, target);
        if (options && options.required) {
            let deleted = delete this[propertyKey];
            if (deleted) {
                let _val = this[propertyKey];
                Object.defineProperty(target, propertyKey, {
                    configurable: true,
                    enumerable: true,
                    get(): NonNullable<typeof type> {
                        if (_val !== null && typeof _val !== "undefined") {
                            return _val;
                        }
                        throw new Error("Value must be not null and undefined");
                    },
                    set(value: NonNullable<typeof type>) {
                        if (value !== null && typeof value !== "undefined") {
                            _val = value;
                        }
                        else {
                            throw new Error("Value must be not null and undefined");
                        }
                    }
                })
            }
        }
    }
}
