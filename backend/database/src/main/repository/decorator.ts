import { addTryCatchWrapper } from "@base/utilities/add-try-catch-wrapper";

export function Repository(target: any){
	Object.keys(target.prototype).map(funcName =>{
		addTryCatchWrapper(target, funcName);
	})
	return target;
}