import mongoose from "mongoose";
import { getForeignField, BASE_ENTITY_SERVICE } from "../../../main/entity";
import { IBaseEntity, ICollection, IDocumentChange, IQueryable, IWherable, ICollectionRestCommand, IDocumentQuery, IDbContextMetadata, IAfterQueryable, IQueryResult } from "../../../interface";
import { getCollectionMetadata } from "./decorator";
import { getDbContextMetadata } from "../decorator";
import { Injectable, getDependency } from "@base/class";


function toSinglePromise<K, T>(classImp: { new(): T }, fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document>) {
	return new Promise<Partial<K>>((resolve, reject) => {
		let query = (fn as mongoose.DocumentQuery<mongoose.Document, mongoose.Document>);
		let foreignFields = getForeignField(classImp);
		let removedFields = [];
		foreignFields.map(foreignField => {
			if (foreignField.load === "eager") {
				query.populate(foreignField.name);
			}
			removedFields.push(foreignField.localField);
		});
		query.then(res => {
			if (res) {
				let document = res.toObject();
				if (document._id) {
					document.id = document._id;
				}
				removedFields.map((removedField) => {
					delete document[removedField];
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

function toListPromise<K, T>(classImp: { new(): T }, type: "query", fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>);
function toListPromise<K, T>(classImp: { new(): T }, type: "aggregate", fn: mongoose.Aggregate<any[]>);
function toListPromise<K, T>(classImp: { new(): T }, type: "query" | "aggregate", fn: mongoose.DocumentQuery<mongoose.Document[], mongoose.Document> | mongoose.Aggregate<any[]>) {
	return new Promise<Partial<K>[]>((resolve, reject) => {
		if (type === "query") {
			let query = (fn as mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>);
			let foreignFields = getForeignField(classImp);
			let removedFields = [];
			foreignFields.map(foreignField => {
				if (foreignField.load === "eager") {
					query.populate(foreignField.name);
				}
				removedFields.push(foreignField.localField);
			});
			query.then(res => {
				let documents = [];
				res.map(r => {
					let document = r.toObject();
					if (document._id) {
						document.id = document._id;
					}
					removedFields.map((removedField) => {
						delete document[removedField];
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
	let cloneDoc = Object.assign({}, doc);
	delete cloneDoc._id;
	delete cloneDoc.__v;
	let docKeys = Object.keys(cloneDoc);
	let docKeyLength = docKeys.length;
	for (let i = 0; i < docKeyLength; i++) {
		let key = docKeys[i];
		if (typeof cloneDoc[key] === "object" && !(cloneDoc[key] instanceof mongoose.Types.ObjectId)) {
			cloneDoc[key] = removeMongooseField(cloneDoc[key]);
		}
	}
	return cloneDoc;
}

function removeId(doc) {
	let cloneDoc = Object.assign({}, doc);
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
	return cloneDoc;
}

function parseSelect<T>(classImp: { new(): T }, selected?: string) {
	if (selected) {
		let selects = selected.split(" ");
		let foreignFields = getForeignField(classImp);
		let rootSelectString = "";
		selects.map((select, index) => {
			let dotIndex = select.indexOf(".");
			if (dotIndex > 0) {
				let rootSelect = select.substring(0, dotIndex);
				rootSelectString += rootSelect + " ";
			}
			else {
				rootSelectString += select + " ";
			}
		});
		rootSelectString = rootSelectString.trimRight();
		foreignFields.map(foreignField => {
			let pattern = new RegExp(foreignField.name, "g");
			rootSelectString = rootSelectString.replace(pattern, foreignField.localField);
		});
		let rootSelects = rootSelectString.split(" ");
		rootSelects.map((rootSelect, index) => {
			let dotIndex = selects[index].indexOf(".");
			let replaceString = selects[index].substring(0, dotIndex);
			if (dotIndex > 0) {
				selects[index] = selects[index].replace(replaceString, rootSelect);
			}
		});
		selected = selects.join(" ");
	}
	return selected;
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
		return query.exec().then(docs => {
			if (Array.isArray(docs)) {
				let documents: Partial<T>[] = [];
				docs.map(doc => {
					let document = new model(removeId(doc));
					document.isNew = false;
					this.setChanges("UPDATE", document, data);
					let tempDocument = new model(removeId(doc));
					tempDocument.isNew = false;
					tempDocument.set(data);
					let returnDocument = tempDocument.toObject();
					returnDocument.id = returnDocument._id;
					delete returnDocument._id;
					documents.push(returnDocument as Partial<T>);
				});
				return documents;
			}
			else {
				if (docs) {
					let document = new model(removeId(docs));
					document.isNew = false;
					this.setChanges("UPDATE", document, data);
					let tempDocument = new model(removeId(docs));
					tempDocument.isNew = false;
					tempDocument.set(data);
					let returnDocument = tempDocument.toObject();
					returnDocument.id = returnDocument._id;
					delete returnDocument._id;
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
		let model = this.model;
		this.dbContext.context.remove("query");
		return query.exec().then(docs => {
			if (Array.isArray(docs)) {
				docs.map(doc => {
					let document = new model(removeId(doc));
					document.isNew = false;
					this.setChanges("REMOVE", document);
				});
				return docs as Partial<T>[];
			}
			else {
				if (docs) {
					let document = new model(removeId(docs));
					document.isNew = false;
					this.setChanges("REMOVE", document);
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
		return this.returnCount().then(total => {
			let query = this.returnQuery();
			let selected = parseSelect(this.classImp, what);
			if (selected) query = query.select(selected);
			let queryInput = Object.assign({}, this.dbContext.context.get<IDocumentQuery>("query"));
			this.dbContext.context.remove("query");
			if (queryInput.multi) {
				let parsedQuery = toListPromise<T, IBaseEntity<T>>(this.classImp, "query", query);
				return parsedQuery.then(value => {
					let queryResult: IQueryResult<T> = {
						end: false,
						numOfRecords: queryInput.limit,
						value: [],
						page: Math.ceil(queryInput.skip / queryInput.limit),
						total: total
					}
					queryResult.value = value;
					if ((value.length < queryResult.numOfRecords) || (value.length * queryResult.page === queryResult.total)) {
						queryResult.end = true;
					}
					return queryResult;
				}).catch(e => Promise.reject(e));
			}
			else {
				let parsedQuery = toSinglePromise<T, IBaseEntity<T>>(this.classImp, query);
				return parsedQuery.then(value => {
					let queryResult: IQueryResult<T> = {
						end: false,
						numOfRecords: queryInput.limit,
						value: [],
						page: Math.ceil(queryInput.skip / queryInput.limit),
						total: total
					}
					queryResult.value = [value];
					if (value) {
						queryResult.value = [value];
						queryResult.numOfRecords = 1;
						queryResult.page = 1;
					}
					else {
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

type TQueryable<T> = IQueryable<T, IAfterQueryable<T>>;

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
	where(conditions: any): IWherable<K, IAfterQueryable<K>> {
		this.setQuery({ where: conditions });
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
		this.setQuery({ sort: conditions });
		return this as any;
	}
	insert(doc: Partial<K>): Promise<Partial<K>> {
		doc = removeId(doc);
		return new Promise<Partial<K>>((resolve, reject) => {
			try {
				let model = this.model;
				let document = new model(doc);
				this.setChanges(document);
				resolve(document.toObject() as Partial<K>);
			}
			catch (e) {
				reject(e);
			}
		});
	}
	insertMany(docs: Array<Partial<K>>): Promise<Partial<K>[]> {
		docs = docs.map(doc => {
			return removeId(doc);
		})
		return new Promise<Partial<K>[]>((resolve, reject) => {
			try {
				let model = this.model;
				let documents = [];
				docs.map((doc, index) => {
					let document = new model(doc);
					this.setChanges(document);
					documents.push(document.toObject() as Partial<K>);
				});
				resolve(documents as Partial<K>[]);
			}
			catch (e) {
				reject(e);
			}
		});
	}

    static getType(): IClassType {
        return Type.get("Collection", "class") as IClassType;
    }
}

export * from "./decorator";