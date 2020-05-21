import mongoose from "mongoose";

export function ensureNew<T>(classImp: { new(): T }, input: T): T {
	if (typeof input === "object") {
		let output = mapData<T>(classImp, input);
		if (output.error) handleError(output.error);
		return output.value || null;
	}
	return input as T;
}
export function removeUndefined(input) {
	if (input && typeof input === "object") {
		let keys = Object.keys(input);
		let keyLength = keys.length;
		for (let i = 0; i < keyLength; i++) {
			let value = input[keys[i]];
			if (typeof value === "undefined") delete input[keys[i]];
			else if (typeof value === "object") {
				let newValue = removeUndefined(value);
				if (typeof newValue === "undefined") delete input[keys[i]];
			}
		}
	}
	return input;
}

function objectIdToString(input) {
	if (input && typeof input === "object") {
		let keys = Object.keys(input);
		let keyLength = keys.length;
		for (let i = 0; i < keyLength; i++) {
			let value = input[keys[i]];
			if (value instanceof mongoose.Types.ObjectId) input[keys[i]] = input[keys[i]].toString();
			else if (typeof value === "object") input[keys[i]] = objectIdToString(value);
		}
	}
	return input;
}

const setSpeacialKey = ["=", "+", "-"];

export function generateSet(input, single, list, parent: boolean = true, parentKey: string = null) {
	input = removeUndefined(input);
	input = objectIdToString(input);
	let setObject = undefined;
	if (!list["$addToSet"]) list["$addToSet"] = {};
	if (!list["$pull"]) list["$pull"] = {};
	if (input) {
		let keys = Object.keys(input);
		let keyLength = keys.length;
		for (let i = 0; i < keyLength; i++) {
			let key = keys[i];
			let value = input[key];
			if (Array.isArray(value)) {
				let lastChar = key[key.length - 1];
				if (setSpeacialKey.includes(lastChar)) {
					key = key.substring(0, key.length - 1);
					if (parentKey) key = [parentKey, key].join(".");
					if (lastChar === "-") list["$pull"][key] = { $in: value };
					else if (lastChar === "+") list["$addToSet"][key] = value;
					else single[key] = value;
				}
				else {
					if (parentKey) key = [parentKey, key].join(".");
					single[key] = value;
				}
			}
			else if (typeof value === "object") {
				if (parentKey) key = [parentKey, key].join(".");
				let output = generateSet(value, single, list, false, key);
				list = output.list;
				single = output.single;
			}
			else {
				if (parentKey) key = [parentKey, key].join(".");
				single[key] = value;
			}
		}
	}
	if (parent) {
		setObject = {};
		if (single && Object.keys(single).length > 0) setObject["$set"] = single;
		if (list && Object.keys(list).length > 0) {
			if (Object.keys(list["$pull"]).length > 0) setObject["$pull"] = list["$pull"];
			if (Object.keys(list["$addToSet"]).length > 0) setObject["$addToSet"] = list["$addToSet"];
		}
		if (Object.keys(setObject).length < 0) setObject = undefined;
		return setObject;
	}
	else {
		return {
			single: single,
			list: list
		}
	}
}