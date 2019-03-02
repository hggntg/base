import { mapData } from "@base/class";

export function ensureNew<T>(classImp: {new() : T}, input: T) : T{
	if(typeof input === "object"){
		let output = mapData<T>(classImp, input);
		return output;
	}
	return input as T;
}