// ===================================================== Map ==============================================
if ("undefined" === typeof Map.prototype.__base__clone) {
    Map.prototype.__base__clone = function <K, V>(this: Map<K, V>): Map<K, V> {
        let newMap = new Map();
        this.forEach((value, key) => {
            newMap.set(key, value);
        });
        return newMap;
    }
}
if ("undefined" === typeof Map.prototype.__base__toJSON) {
    Map.prototype.__base__toJSON = function (this: Map<any, any>): string {
        let temp = this.__base__convertToObject(true);
        let jsonString = `Map(${JSON.__base__circularStringify(temp)})`;
        return jsonString;
    }
}
if ("undefined" === typeof Map.prototype.__base__convertToObject) {
    Map.prototype.__base__convertToObject = function <K, V>(this: Map<K, V>, nested: boolean = false): V {
        let obj = {};
        this.forEach((value, key) => {
            let keyString = "";
            if (typeof key === "string") {
                keyString = key;
            }
            else {
                keyString = key.toString();
            }
            if (value instanceof Map) {
                if (nested) obj[keyString] = value.__base__convertToObject();
                else obj[keyString] = value;
            }
            else {
                obj[keyString] = value;
            }
        });
        return obj as V;
    }
}
if ("undefined" === typeof Map.__base__fromObject) {
    Map.__base__fromObject = function <V>(obj: any): Map<keyof V, V[keyof V]> {
        const newMap = new Map();
        if (obj) {
            let keys = Object.keys(obj);
            Object.values(obj).map((value, index) => {
                newMap.set(keys[index], value);
            });
            return newMap;
        }
        else {
            throw new Error("Can't convert null or undefined to Map");
        }
    }
}
if ("undefined" === typeof Map.__base__fromJSON) {
    Map.__base__fromJSON = function (input: string): Map<any, any> {
        input = input.replace("Map(", "");
        input = input.substring(0, input.length - 1);
        let obj = JSON.__base__circularParse(input);
        let temp = Map.__base__fromObject<any>(obj);
        return temp;
    }
}