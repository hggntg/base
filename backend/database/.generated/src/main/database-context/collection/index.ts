import mongoose, { Document, HookSyncCallback } from "mongoose";
import { getForeignField, BASE_ENTITY_SERVICE, getEntitySchema } from "../../../main/entity";
import { IBaseEntity, ICollection, IDocumentChange, IQueryable, IWherable, ICollectionRestCommand, IDocumentQuery, IDbContextMetadata, IAfterQueryable, IQueryResult, TEntityForeignField, IFakePreDocument } from "../../../interface";
import { getCollectionMetadata } from "./decorator";
import { getDbContextMetadata } from "../decorator";
import { Injectable, getDependency, assignData } from "@base/class";
import { generateSet } from "../../../infrastructure/utilities";
import objectPath from "object-path";

type TRemovedFieldType = {
	type: "one-to-one" | "one-to-many",
	localField: string,
	relatedEntity: {new(...args): any};
	name: string,
	load: "eager" | "lazy"
};

function generateRemovedFields<K, T>(selected: any[], classImp: { new(): T }, root?: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document> | mongoose.DocumentQuery<mongoose.Document, mongoose.Document> | mongoose.Document): TRemovedFieldType[] {
	let foreignFields = getForeignField(classImp);
	let removedFields: TRemovedFieldType[] = [];
	let selecetedPaths = [];
	selected.map((select) => {
		selecetedPaths.push(select.path);
	});
	foreignFields.map(foreignField => {
		if (root && foreignField.load === "eager" || (foreignField.type === "one-to-many" && foreignField.load === "lazy")) {
			let index = selecetedPaths.indexOf(foreignField.name);
			if (index >= 0) {
				root.populate(selected[index]);
			}
			else {
				root.populate(foreignField.name);
			}
		}
		removedFields.push({ type: foreignField.type, localField: foreignField.localField, name: foreignField.name, load: foreignField.load, relatedEntity: foreignField.relatedEntity });
	});
	return removedFields;
}

function toSinglePromise<K, T>(classImp: { new(): T }, fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document>, selected: any[]) {
	return new Promise<Partial<K>>((resolve, reject) => {
		let query = (fn as mongoose.DocumentQuery<mongoose.Document, mongoose.Document>);
		let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>(selected, classImp, query);
		query.then(res => {
			if (res) {
				let document = res.toObject();
				if (document._id) {
					document.id = document._id;
				}
				removedFields.map((removedField) => {
					if (removedField.load === "lazy") {
						if (removedField.type === "one-to-one") {
							document[removedField.name] = { _id: document[removedField.localField], id: document[removedField.localField] };
						}
						else {
							if (document[removedField.name] && Array.isArray(document[removedField.name])) {
								document[removedField.name] = document[removedField.name].map(doc => {
									doc = { _id: doc, id: doc };
									return doc;
								})
							}
						}
					}
					if (removedField.type === "one-to-one") {
						delete document[removedField.localField];
					}
					if(document[removedField.name]){
						let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, removedField.relatedEntity.name);
						let refRemovedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(refInstance));
						if(removedField.type === "one-to-one"){
							refRemovedFields.map((refRemovedField) => {
								if(refRemovedField.type === "one-to-one"){
									delete document[removedField.name][refRemovedField.localField];
								}
							});
						}
						else {
							refRemovedFields.map((refRemovedField) => {
								if(refRemovedField.type === "one-to-one"){
									if(Array.isArray(document[removedField.name])){
										document[removedField.name] = document[removedField.name].map(doc => {
											delete doc[refRemovedField.localField];
											return doc;
										})
									}
								}
							});
						}
					}
				});
				document = removeMongooseField(document);
				resolve(document as Partial<K>);
			}
			else {
				resolve(null);
			}
		}).catch(err => {
			reject(err);
		})
	});
}

function toListPromise<K, T>(classImp: { new(): T }, type: "query", fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>, selected: any[]);
function toListPromise<K, T>(classImp: { new(): T }, type: "aggregate", fn: mongoose.Aggregate<any[]>, selected: any[]);
function toListPromise<K, T>(classImp: { new(): T }, type: "query" | "aggregate", fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document> | mongoose.Aggregate<any[]>, selected: any[]) {
	return new Promise<Partial<K>[]>((resolve, reject) => {
		if (type === "query") {
			let query = (fn as mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>);
			let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>(selected, classImp, query);
			query.then(res => {
				let documents = [];
				res.map(r => {
					let document = r.toObject();
					if (document._id) {
						document.id = document._id;
					}
					removedFields.map((removedField) => {
						if (removedField.load === "lazy") {
							if(removedField.type === "one-to-one"){
								document[removedField.name] = { _id: document[removedField.localField], id: document[removedField.localField] };
							}
							else{
								if (document[removedField.name] && Array.isArray(document[removedField.name])) {
									document[removedField.name] = document[removedField.name].map(doc => {
										doc = { _id: doc, id: doc };
										return doc;
									})
								}
							}
						}
						if(removedField.type === "one-to-one"){
							delete document[removedField.localField];
						}
						if(document[removedField.name]){
							let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, removedField.relatedEntity.name)
							let refRemovedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(refInstance));
							if(removedField.type === "one-to-one"){
								refRemovedFields.map((refRemovedField) => {
									if(refRemovedField.type === "one-to-one"){
										delete document[removedField.name][refRemovedField.localField];
									}
								});
							}
							else {
								refRemovedFields.map((refRemovedField) => {
									if(refRemovedField.type === "one-to-one"){
										if(Array.isArray(document[removedField.name])){
											document[removedField.name] = document[removedField.name].map(doc => {
												delete doc[refRemovedField.localField];
												return doc;
											})
										}
									}
								});
							}
						}
					});
					document = removeMongooseField(document);
					documents.push(document);
				});
				resolve(documents as Partial<K>[]);
			}).catch(err => {
				reject(err);
			});
		}
		else {
			(fn as mongoose.Aggregate<any[]>).then(res => {
				let documents = [];
				res.map(r => {
					if (r._id) {
						r.id = r._id;
						delete r._id;
					}
					documents.push(r);
				});
				resolve(documents as Partial<K>[]);
			}).catch(err => {
				reject(err);
			});
		}
	});
}

function removeMongooseField(doc) {
	let cloneDoc = assignData(doc, ["id", "_id"]);
	if (cloneDoc) {
		// delete cloneDoc._id;
		delete cloneDoc.__v;
		let docKeys = Object.keys(cloneDoc);
		let docKeyLength = docKeys.length;
		for (let i = 0; i < docKeyLength; i++) {
			let key = docKeys[i];
			if (typeof cloneDoc[key] === "object" && !(cloneDoc[key] instanceof mongoose.Types.ObjectId)) {
				cloneDoc[key] = removeMongooseField(cloneDoc[key]);
			}
		}
	}
	return cloneDoc;
}

function removeId(doc) {
	let cloneDoc = assignData(doc, ["id", "_id"]);
	if (cloneDoc) {
		if (cloneDoc.id) {
			cloneDoc._id = cloneDoc.id;
			delete cloneDoc.id;
		}
		let docKeys = Object.keys(cloneDoc);
		let docKeyLength = docKeys.length;
		for (let i = 0; i < docKeyLength; i++) {
			let key = docKeys[i];
			if (typeof cloneDoc[key] === "object" && !(cloneDoc[key] instanceof mongoose.Types.ObjectId)) {
				cloneDoc[key] = removeId(cloneDoc[key]);
			}
		}
	}
	return cloneDoc;
}

function replaceSearchKeys(input: object, key: string, replaceKey){
	let keys = Object.keys(input);
	let keyLength = keys.length;
	for(let i = 0; i < keyLength; i++){
		if(keys[i] === key){
			input[replaceKey] = input[key];
			keys[i] = replaceKey;
			i--;
			delete input[key];
		}
		else {
			if(typeof input[key] === "object"){
				input = replaceSearchKeys(input[key], key, replaceKey);
			}
		}
	}
	return input;
}

function parseSelect<T>(classImp: { new(): T }, selected?: string) {
	let selectedObject = [];
	let foreignFields = getForeignField(classImp);
	let hides: { [key in string]: { includes?: string[], excludes?: string[] } } = {};
	foreignFields.map(foreignField => {
		hides[foreignField.name] = { includes: [], excludes: [] };
		(foreignField.hide as string[]).map(hideField => {
			if (hideField.indexOf("-") === 0) {
				hides[foreignField.name].excludes.push(hideField.substring(1, hideField.length));
			}
			else {
				hides[foreignField.name].includes.push(hideField);
			}
		});
		if (hides[foreignField.name].excludes.length === 0) hides[foreignField.name].excludes = undefined;
		if (hides[foreignField.name].includes.length === 0) hides[foreignField.name].includes = undefined;
		if (hides[foreignField.name].excludes) hides[foreignField.name].includes = undefined;
	});
	if (selected) {
		let selects = selected.split(" ");
		let rootSelects: { [key: string]: string[] } = {};
		// let unCheckedForeignFields: TEntityForeignField<T>[] = [];
		selects.map((select) => {
			let dotIndex = select.indexOf(".");
			if (dotIndex > 0) {
				let rootSelect = select.substring(0, dotIndex);
				if (!rootSelects[rootSelect]) rootSelects[rootSelect] = [];
				let innerSelect = select.substring(dotIndex + 1, select.length);
				rootSelects[rootSelect].push(innerSelect);
			}
			else {
				selectedObject.push(select);
			}
		});
		let rootSelectKeys = Object.keys(rootSelects);
		foreignFields.map((foreignField) => {
			let checked = rootSelectKeys.includes(foreignField.name);
			// let currentIndex = unCheckedForeignFields.push(foreignField) - 1;
			if (checked) {
				// unCheckedForeignFields.splice(currentIndex, 1);
				let selectObject = {
					path: foreignField.name,
					select: ""
				}
				rootSelects[foreignField.name].map(innerSelect => {
					if (hides[foreignField.name].includes) {
						if (hides[foreignField.name].includes.includes(innerSelect)) {
							selectObject.select += "-" + innerSelect + " ";
						}
					}
					else if (hides[foreignField.name].excludes) {
						if (hides[foreignField.name].excludes.includes(innerSelect)) {
							selectObject.select += innerSelect + " ";
						}
					}
				});
				selectObject.select = selectObject.select.trimRight();
				if (selectObject.select) selectedObject.push(selectObject);
			}
		});
		// unCheckedForeignFields.map(unCheckedForeignField => {
		// 	let selectObject = {
		// 		path: unCheckedForeignField.name,
		// 		select: ""
		// 	};
		// 	(unCheckedForeignField.hide as string[]).map(hideField => {
		// 		if (hideField.indexOf("-") === 0) {

		// 		}
		// 	});
		// });
	}
	else {
		let foreignFieldNames = Object.keys(hides);
		Object.values(hides).map((hide, index) => {
			let selectObject = {
				path: foreignFieldNames[index],
				select: ""
			};
			if (hide.includes) {
				selectObject.select = hide.includes.join(" -");
				selectObject.select = "-" + selectObject.select;
			}
			else if (hide.excludes) {
				selectObject.select = hide.excludes.join(" ");
			}
			if (selectObject.select) selectedObject.push(selectObject);
		});
	}
	return selectedObject;
}

export class CollectionRestCommand<T> implements ICollectionRestCommand<T> {
	private dbContext: IDbContextMetadata;
	private entity: IBaseEntity;
	private classImp: { new(): IBaseEntity<T> };
	private get model(): mongoose.Model<any> {
		return this.entity.getInstance();
	}
	private setChanges(type: "REMOVE" | "UPDATE", document: mongoose.Document, data?: any) {
		let namespace = this.dbContext.context;
		if (namespace) {
			let session = namespace.get<Promise<mongoose.ClientSession>>("session");
			if (!session) {
				session = this.dbContext.connection.startSession();
				namespace.set("session", session);
			}
			let documents = namespace.get<IDocumentChange[]>("documents") || [];
			documents.push({ type: type, document: document, data: data });
			namespace.set("documents", documents);
		}
		else {
			throw new Error("DbContext change detector not exists");
		}
	}
	private returnCount(): Promise<number> {
		let namespace = this.dbContext.context;
		if (namespace) {
			let query: IDocumentQuery = namespace.get<IDocumentQuery>("query") || {};
			let queryCommand: mongoose.Query<any>;
			if (query.multi) {
				if (query.where) queryCommand = this.model.find(query.where);
				else queryCommand = this.model.find();
				return queryCommand.countDocuments().then(length => Promise.resolve(length)).catch(e => Promise.reject(e));
			}
			else {
				return Promise.resolve(1);
			}
		}
		else {
			return Promise.reject(new Error("DbContext change detector not exists"));
		}
	}
	private returnQuery(): mongoose.Query<any> {
		let namespace = this.dbContext.context;
		if (namespace) {
			let query: IDocumentQuery = namespace.get<IDocumentQuery>("query") || {};
			let queryCommand: mongoose.Query<any>;
			if (query.multi) {
				if (query.where) queryCommand = this.model.find(query.where);
				else queryCommand = this.model.find();
				if (!query.skip) query.skip = 0;
				if (!query.limit) {
					if (query.multi) query.limit = 10;
					else query.limit = 1;
				}
				queryCommand = queryCommand.skip(query.skip);
				queryCommand = queryCommand.limit(query.limit);
				if (query.sort) queryCommand = queryCommand.sort(query.sort);
			}
			else {
				if (query.where) queryCommand = this.model.findOne(query.where);
				else queryCommand = this.model.findOne();
			}
			namespace.set("query", query);
			return queryCommand;
		}
		else {
			throw new Error("DbContext change detector not exists");
		}
	}
	update(data: T) {
		let query: mongoose.Query<any> = this.returnQuery();
		this.dbContext.context.remove("query");
		let model = this.model;
		let entity = this.entity;
		let entitySchema = getEntitySchema(entity);
		return query.exec().then(docs => {
			if (Array.isArray(docs)) {
				let documents: Partial<T>[] = [];
				docs.map(doc => {
					data = generateSet(data, {}, {});
					let tempDocument = new model(removeId(doc.toObject()));
					tempDocument.isNew = false;
					tempDocument.id = doc._id;
					if (data) {
						if (data["$set"]) {
							let keys = Object.keys(data["$set"]);
							Object.values(data["$set"]).map((value, index) => {
								objectPath.set(tempDocument, keys[index], value);
							});
						}
						if (data["$pull"]) {
							let keys = Object.keys(data["$pull"]);
							Object.values(data["$pull"]).map((value: [], index) => {
								let currentValue = objectPath.get(tempDocument, keys[index]);
								value["$in"].map(v => {
									let index = currentValue.indexOf(v);
									if (index >= 0) currentValue.splice(index, 1);
								});
								objectPath.set(tempDocument, keys[index], currentValue);
							});
						}
						if (data["$addToSet"]) {
							let keys = Object.keys(data["$addToSet"]);
							Object.values(data["$addToSet"]).map((value: [], index) => {
								let currentValue = objectPath.get(tempDocument, keys[index]);
								value.map(v => {
									let index = currentValue.indexOf(v);
									if (index < 0) {
										currentValue.push(v);
									}
								});
								objectPath.set(tempDocument, keys[index], currentValue);
							});
						}
					}
					entitySchema.middleware.map(middleware => {
						if (middleware.type === "preDocument") {
							let preDocumentMiddleware = middleware as IFakePreDocument<typeof entity>;
							if (preDocumentMiddleware.hook === "save") {
								(<HookSyncCallback<Document & typeof entity>>preDocumentMiddleware.arg0).apply(tempDocument, [(err) => {
									if (err) {
										throw err;
									}
									else {
										return;
									}
								}]);
							}
						}
					});
					this.setChanges("UPDATE", doc, tempDocument);
					let returnDocument = tempDocument.toObject();
					// delete returnDocument._id;
					documents.push(returnDocument as Partial<T>);
				});
				return documents;
			}
			else {
				if (docs) {
					let doc = docs;
					data = generateSet(data, {}, {});
					let tempDocument = new model(removeId(doc.toObject()));
					tempDocument.isNew = false;
					tempDocument.id = doc._id;
					if (data) {
						if (data["$set"]) {
							let keys = Object.keys(data["$set"]);
							Object.values(data["$set"]).map((value, index) => {
								objectPath.set(tempDocument, keys[index], value);
							});
						}
						if (data["$pull"]) {
							let keys = Object.keys(data["$pull"]);
							Object.values(data["$pull"]).map((value: [], index) => {
								let currentValue = objectPath.get(tempDocument, keys[index]);
								value["$in"].map(v => {
									let index = currentValue.indexOf(v);
									if (index >= 0) currentValue.splice(index, 1);
								});
								objectPath.set(tempDocument, keys[index], currentValue);
							});
						}
						if (data["$addToSet"]) {
							let keys = Object.keys(data["$addToSet"]);
							Object.values(data["$addToSet"]).map((value: [], index) => {
								let currentValue = objectPath.get(tempDocument, keys[index]);
								value.map(v => {
									let index = currentValue.indexOf(v);
									if (index < 0) {
										currentValue.push(v);
									}
								});
								objectPath.set(tempDocument, keys[index], currentValue);
							});
						}
					}
					entitySchema.middleware.map(middleware => {
						if (middleware.type === "preDocument") {
							let preDocumentMiddleware = middleware as IFakePreDocument<typeof entity>;
							if (preDocumentMiddleware.hook === "save") {
								(<HookSyncCallback<Document & typeof entity>>preDocumentMiddleware.arg0).apply(tempDocument, [(err) => {
									if (err) {
										throw err;
									}
									else {
										return;
									}
								}]);
							}
						}
					});
					let returnDocument = tempDocument.toObject();
					this.setChanges("UPDATE", doc, returnDocument);
					// delete returnDocument._id;
					return returnDocument as Partial<T>;
				}
				else {
					return docs;
				}
			}
		});
	}
	remove(): Promise<Partial<T> | Partial<T>[]> {
		let query: mongoose.Query<any> = this.returnQuery();
		this.dbContext.context.remove("query");
		return query.exec().then(docs => {
			if (Array.isArray(docs)) {
				docs = docs.map(doc => {
					this.setChanges("REMOVE", doc);
					doc.id = doc._id;
					return doc;
				});
				return docs as Partial<T>[];
			}
			else {
				if (docs) {
					this.setChanges("REMOVE", docs);
					docs.id = docs._id;
					return docs as Partial<T>;
				}
				else {
					return docs;
				}
			}
		})
	}
	count?(): Promise<number> {
		let query = this.returnQuery();
		query = query.countDocuments();
		this.dbContext.context.remove("query");
		return query.exec().then(length => Promise.resolve(length)).catch(e => Promise.reject(e));
	}
	select?(what?: string): Promise<IQueryResult<T>> {
		let query = this.returnQuery();
		let queryInput = assignData(this.dbContext.context.get<IDocumentQuery>("query"));
		this.dbContext.context.remove("query");
		return this.returnCount().then(total => {
			let selected = parseSelect(this.classImp, what);
			if (selected) {
				let selectedLength = selected.length;
				for (let i = 0; i < selectedLength; i++) {
					if (typeof selected[i] === "string") {
						query = query.select(selected[i]);
						selected.splice(i);
						i--;
					}
				}
			}

			if (queryInput.multi) {
				let parsedQuery = toListPromise<T, IBaseEntity<T>>(this.classImp, "query", query, selected || []);
				return parsedQuery.then(value => {
					let queryResult: IQueryResult<T> = {
						end: false,
						numOfRecords: queryInput.limit,
						value: [],
						page: Math.ceil(queryInput.skip / queryInput.limit),
						total: total
					}
					if (value) {
						queryResult.value = value;
						if ((value.length < queryResult.numOfRecords) || (value.length * queryResult.page === queryResult.total)) {
							queryResult.end = true;
						}
					}
					else {
						queryResult.end = true;
					}
					return queryResult;
				}).catch(e => Promise.reject(e));
			}
			else {
				let parsedQuery = toSinglePromise<T, IBaseEntity<T>>(this.classImp, query, selected);
				return parsedQuery.then(value => {
					let queryResult: IQueryResult<T> = {
						end: false,
						numOfRecords: queryInput.limit,
						value: [],
						page: Math.ceil(queryInput.skip / queryInput.limit) || 1,
						total: total
					}
					queryResult.value = [value];
					if (value) {
						queryResult.value = [value];
						queryResult.numOfRecords = 1;
						queryResult.page = 1;
					}
					else {
						queryResult.value = [];
						queryResult.end = true;
					}
					return queryResult;
				}).catch(e => Promise.reject(e));
			}
		});
	}
	then<TResult1 = IQueryResult<T>, TResult2 = never>(
		onfulfilled?: (value: IQueryResult<T>) => TResult1 | PromiseLike<TResult1>,
		onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
	): Promise<TResult1 | TResult2> {
		let queryResult = this.select();
		return queryResult.then(onfulfilled, onrejected);
	}
	constructor(_dbContext: IDbContextMetadata, _classImp: { new(): IBaseEntity<T> }, _entity: IBaseEntity) {
		this.dbContext = _dbContext;
		this.classImp = _classImp;
		this.entity = _entity;
	}

    static getType(): IClassType {
        return Type.get("CollectionRestCommand", "class") as IClassType;
    }
}

export const COLLECTION_SERVICE = "ICollection";

type TQueryable<T> = IQueryable<T, IAfterQueryable<T>, IAfterQueryable<T>>;

@Injectable(COLLECTION_SERVICE, true, true)
export class Collection<K, T extends IBaseEntity<K>> implements ICollection<K, T>{
	getType(): IClassType {
        return Type.get("Collection", "class") as IClassType;
    }
	constructor() {
	}
	private collectionRestCommand: ICollectionRestCommand<K>;
	private setQuery(inputQuery: IDocumentQuery) {
		let namespace = this.dbContext.context;
		if (namespace) {
			let query: IDocumentQuery = namespace.get<IDocumentQuery>("query") || {};
			if (inputQuery.limit) query.limit = inputQuery.limit;
			if (inputQuery.skip) query.skip = inputQuery.skip;
			if (inputQuery.multi) query.multi = inputQuery.multi;
			if (inputQuery.select) query.select = inputQuery.select;
			if (inputQuery.sort) query.sort = inputQuery.sort;
			if (inputQuery.where) query.where = inputQuery.where;
			namespace.set("query", query);
		}
		else {
			throw new Error("DbContext change detector not exists");
		}
	}
	private setChanges(document: mongoose.Document, data?: any) {
		let namespace = this.dbContext.context;
		if (namespace) {
			let session = namespace.get<Promise<mongoose.ClientSession>>("session");
			if (!session) {
				session = this.connection.startSession();
				namespace.set("session", session);
			}
			let documents = namespace.get<IDocumentChange[]>("documents") || [];
			documents.push({ type: "INSERT", document: document, data: data });
			namespace.set("documents", documents);
		}
		else {
			throw new Error("DbContext change detector not exists");
		}
	}
	private get model(): mongoose.Model<any> {
		return this.entity.getInstance();
	}
	private get connection() {
		return this.dbContext.connection;
	}
	private get dbContext() {
		let collectionMetadata = getCollectionMetadata(this.classImp);
		let dbContextMetadata = getDbContextMetadata(collectionMetadata.dbContextClass);
		return dbContextMetadata;
	}
	private entity: IBaseEntity;
	private classImp: { new(): T };

	initValue(input: Partial<{ classImp: { new(): T } }>) {
		this.entity = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, input.classImp.name);
		this.classImp = input.classImp;
		this.collectionRestCommand = new CollectionRestCommand(this.dbContext, this.classImp, this.entity);
	}
	find(): ICollectionRestCommand<K> {
		this.setQuery({ multi: true });
		return this.collectionRestCommand;
	}
	findOne(): ICollectionRestCommand<K> {
		this.setQuery({ multi: false });
		return this.collectionRestCommand;
	}
	where(conditions: any): IWherable<K, IAfterQueryable<K>, IAfterQueryable<K>> {
		if (conditions) {
			let whereCondition = removeId(conditions);
			let foreignFields = getForeignField(this.entity);
			foreignFields.map(foreignField => {
				whereCondition = replaceSearchKeys(whereCondition, foreignField.name, foreignField.localField);
			})
			this.setQuery({ where: whereCondition });
		}
		return this as any;
	}
	limit?<Q extends TQueryable<K>>(about: number): Pick<Q, Exclude<keyof Q, "limit">> {
		this.setQuery({ limit: about });
		return this as any;
	}
	skip?<Q extends TQueryable<K>>(about: number): Pick<Q, Exclude<keyof Q, "skip">> {
		this.setQuery({ skip: about });
		return this as any;
	}
	sort?<Q extends TQueryable<K>>(conditions: any): Pick<Q, Exclude<keyof Q, "sort">> {
		if (conditions) {
			this.setQuery({ sort: conditions });
		}
		return this as any;
	}
	insert(doc: Partial<K>): Promise<Partial<K>> {
		doc = removeId(doc);
		try {
			let model = this.model;
			let document = new model(doc);
			let newDoc = document.toObject();
			this.setChanges(document);
			let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(this.entity), document);
			return document.execPopulate().then(doc => {
				removedFields.map(removedField => {
					if (removedField.type === "one-to-one") {
						if (removedField.load === "lazy") {
							newDoc[removedField.name] = { _id: doc[removedField.localField], id: doc[removedField.localField] };
						}
						else {
							if (!doc[removedField.name]) {
								newDoc[removedField.name] = doc[removedField.name];
							}
							else {
								if (typeof doc[removedField.name].toObject === "function") {
									newDoc[removedField.name] = doc[removedField.name].toObject();
								}
								else {
									newDoc[removedField.name] = doc[removedField.name];
								}
							}
						}
					}
					delete newDoc[removedField.localField];
				});
				newDoc.id = newDoc._id;
				newDoc = removeMongooseField(newDoc);
				return newDoc;
			});
		}
		catch (e) {
			throw e;
		}
	}
	insertMany(docs: Array<Partial<K>>): Promise<Partial<K>[]> {
		docs = docs.map(doc => {
			return removeId(doc);
		})
		try {
			let model = this.model;
			let documents = [];
			docs.map((doc, index) => {
				let document = new model(doc);
				this.setChanges(document);
				let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(this.entity), document);
				let newDocPromise = document.execPopulate().then(doc => {
					let newDoc = document.toObject();
					removedFields.map(removedField => {
						if (removedField.type === "one-to-one") {
							if (removedField.load === "lazy") {
								newDoc[removedField.name] = { _id: doc[removedField.localField], id: doc[removedField.localField] };
							}
							else {
								if (!doc[removedField.name]) {
									newDoc[removedField.name] = doc[removedField.name];
								}
								else {
									if (typeof doc[removedField.name].toObject === "function") {
										newDoc[removedField.name] = doc[removedField.name].toObject();
									}
									else {
										newDoc[removedField.name] = doc[removedField.name];
									}
								}
							}
						}
						delete newDoc[removedField.localField];
					});
					newDoc.id = newDoc._id;
					newDoc = removeMongooseField(newDoc);
					return newDoc;
				});
				documents.push(newDocPromise);
			});
			return Promise.all(documents);
		}
		catch (e) {
			throw e;
		}
	}

    static getType(): IClassType {
        return Type.get("Collection", "class") as IClassType;
    }
}

export * from "./decorator";