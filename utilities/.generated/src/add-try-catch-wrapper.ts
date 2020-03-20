export function addTryCatchWrapper(ClassImp: any, funcName){
	let func: Function = ClassImp.prototype[funcName];
	let funcString = func.toString();
	let paramsString = funcString.split("(")[1].split(")")[0];
	let expression = `ClassImp.prototype["${funcName}"] = function ${funcName}(${paramsString}){
		try{
			return func.apply(this, arguments);
		}
		catch(e){
			console.error(e);
		}
	}`;
	eval(expression);
}