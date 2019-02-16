export function defaultValue(input: any){
	if(Array.isArray(input)){
        return [];
    }
    else if(typeof input === "object"){
        return {};
    }
    else{
        return input;
    }
}