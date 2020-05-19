import mongoose, { Document, HookSyncCallback, QueryCursor } from "mongoose";
import { getForeignField, BASE_ENTITY_SERVICE, getEntitySchema } from "@app/main/entity";
import { IBaseEntity, ICollection, IDocumentChange, IQueryable, IWherable, ICollectionRestCommand, IDocumentQuery, IDbContextMetadata, IAfterQueryable, IQueryResult, IFakePreDocument, IAggregateOption, IAfterAggregate } from "@app/interface";
import { getCollectionMetadata } from "@app/main/database-context/collection/decorator";
import { getDbContextMetadata } from "@app/main/database-context/decorator";
import { generateSet } from "@app/infrastructure/utilities";
import { ICache, Cache } from "@app/main/database-context/collection/cache";
import { IMetadata } from "@app/main/event-store";

const cache: ICache = new Cache();

type TRemovedFieldType = {
	type: "one-to-one" | "one-to-many",
	localField: string,
	bridgeField?: string,
	refKey?: string,
	bridgeEntity?: { new(...args): any };
	relatedEntity: { new(...args): any };
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
		let removedField: TRemovedFieldType;
		if (root && (foreignField.load === "eager" || (foreignField.type === "one-to-many" && foreignField.load === "lazy"))) {
			let name = foreignField.name;
			if ((<any>foreignField).bridgeEntity) {
				let bridgeInstance = getDependency(BASE_ENTITY_SERVICE, (<any>foreignField).bridgeEntity.name);
				let bridge = getEntitySchema(bridgeInstance);
				name = bridge.name + "_" + name;
			}
			let index = selecetedPaths.indexOf(name);
			if (index >= 0) {
				root.populate(selected[index]);
			}
			else {
				if ((<any>foreignField).bridgeEntity) {
					let refInstance = getDependency(BASE_ENTITY_SERVICE, foreignField.relatedEntity.name);
					let ref = getEntitySchema(refInstance);
					root.populate({
						path: name,
						populate: {
							path: foreignField.refKey,
							model: ref.name
						}
					});
					removedField = {
						type: foreignField.type,
						localField: foreignField.localField,
						refKey: foreignField.refKey,
						name: foreignField.name,
						load: foreignField.load,
						bridgeEntity: (<any>foreignField).bridgeEntity,
						bridgeField: (<any>foreignField).bridgeKey,
						relatedEntity: foreignField.relatedEntity
					};
				}
				else {
					root.populate(name);
				}
			}
		}
		if (!removedField) removedField = { type: foreignField.type, localField: foreignField.localField, name: foreignField.name, load: foreignField.load, relatedEntity: foreignField.relatedEntity };
		removedFields.push(removedField);
	});
	return removedFields;
}

function toSinglePromise<K, T>(classImp: { new(): T }, type: "query", fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document>, selected: any[]);
function toSinglePromise<K, T>(classImp: { new(): T }, type: "document", doc: mongoose.Document, selected: any[]);
function toSinglePromise<K, T>(classImp: { new(): T }, type: "query" | "document", fn: mongoose.DocumentQuery<mongoose.Document, mongoose.Document> | mongoose.Document, selected: any[]) {
	return new Promise<Partial<K>>((resolve, reject) => {
		if (type === "query") {
			let query = (fn as mongoose.DocumentQuery<mongoose.Document, mongoose.Document>);
			let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>(selected, classImp, query);
			query.then(res => {
				if (res) {
					let document = res.toObject();
					removedFields.map((removedField) => {
						if (removedField.bridgeEntity) {
							let bridgeInstance = getDependency(BASE_ENTITY_SERVICE, removedField.bridgeEntity.name);
							let bridge = getEntitySchema(bridgeInstance);
							let localField = bridge.name + "_" + removedField.name;
							let refField = removedField.refKey;
							document[removedField.name] = [];
							if (document[localField] && Array.isArray(document[localField])) {
								document[localField].map((localDocument) => {
									let refDocument = localDocument[refField];
									if (removedField.load === "lazy") {
										document[removedField.name].push({
											_id: refDocument._id,
											id: refDocument._id
										});
									}
									else {
										document[removedField.name].push(refDocument);
									}
								});
								delete document[localField];
							}
						}
						else {
							if (removedField.load === "lazy") {
								if (removedField.type === "one-to-one") {
									document[removedField.name] = { _id: document[removedField.localField], id: document[removedField.localField] };
								}
								else {
									if (document[removedField.name] && Array.isArray(document[removedField.name])) {
										document[removedField.name] = document[removedField.name].map(doc => {
											if (doc && doc._id) {
												doc = { _id: doc._id, id: doc._id };
											}
											else {
												doc = { _id: doc, id: doc };
											}
											return doc;
										})
									}
								}
							}
							if (removedField.type === "one-to-one") {
								delete document[removedField.localField];
							}
						}
						if (document[removedField.name]) {
							let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, removedField.relatedEntity.name);
							let refRemovedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(refInstance));
							if (removedField.type === "one-to-one") {
								refRemovedFields.map((refRemovedField) => {
									if (refRemovedField.type === "one-to-one") {
										delete document[removedField.name][refRemovedField.localField];
									}
								});
							}
							else {
								refRemovedFields.map((refRemovedField) => {
									if (refRemovedField.type === "one-to-one") {
										if (Array.isArray(document[removedField.name])) {
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
			});
		}
		else {
			if (fn) {
				let doc = fn as mongoose.Document;
				let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>(selected, classImp, doc);
				let document = doc.toObject();
				removedFields.map((removedField) => {
					if (removedField.load === "lazy") {
						if (removedField.type === "one-to-one") {
							document[removedField.name] = { _id: document[removedField.localField], id: document[removedField.localField] };
						}
						else {
							if (document[removedField.name] && Array.isArray(document[removedField.name])) {
								document[removedField.name] = document[removedField.name].map(doc => {
									if (doc && doc._id) {
										doc = { _id: doc._id, id: doc._id };
									}
									else {
										doc = { _id: doc, id: doc };
									}
									return doc;
								})
							}
						}
					}
					if (removedField.type === "one-to-one") {
						delete document[removedField.localField];
					}
					if (document[removedField.name]) {
						let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, removedField.relatedEntity.name);
						let refRemovedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(refInstance));
						if (removedField.type === "one-to-one") {
							refRemovedFields.map((refRemovedField) => {
								if (refRemovedField.type === "one-to-one") {
									delete document[removedField.name][refRemovedField.localField];
								}
							});
						}
						else {
							refRemovedFields.map((refRemovedField) => {
								if (refRemovedField.type === "one-to-one") {
									if (Array.isArray(document[removedField.name])) {
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
		}
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
					removedFields.map((removedField) => {
						if (removedField.bridgeEntity) {
							let bridgeInstance = getDependency(BASE_ENTITY_SERVICE, removedField.bridgeEntity.name);
							let bridge = getEntitySchema(bridgeInstance);
							let localField = bridge.name + "_" + removedField.name;
							let refField = removedField.refKey;
							document[removedField.name] = [];
							if (document[localField] && Array.isArray(document[localField])) {
								document[localField].map((localDocument) => {
									let refDocument = localDocument[refField];
									if (removedField.load === "lazy") {
										document[removedField.name].push({
											_id: refDocument._id,
											id: refDocument._id
										});
									}
									else {
										document[removedField.name].push(refDocument);
									}
								});
								delete document[localField];
							}
						}
						else {
							if (removedField.load === "lazy") {
								if (removedField.type === "one-to-one") {
									document[removedField.name] = { _id: document[removedField.localField], id: document[removedField.localField] };
								}
								else {
									if (document[removedField.name] && Array.isArray(document[removedField.name])) {
										document[removedField.name] = document[removedField.name].map(doc => {
											if (doc && doc._id) {
												doc = { _id: doc._id, id: doc._id };
											}
											else {
												doc = { _id: doc, id: doc };
											}
										})
									}
								}
							}
							if (removedField.type === "one-to-one") {
								delete document[removedField.localField];
							}
						}
						if (document[removedField.name]) {
							let refInstance = getDependency<IBaseEntity>(BASE_ENTITY_SERVICE, removedField.relatedEntity.name)
							let refRemovedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(refInstance));
							if (removedField.type === "one-to-one") {
								refRemovedFields.map((refRemovedField) => {
									if (refRemovedField.type === "one-to-one") {
										delete document[removedField.name][refRemovedField.localField];
									}
								});
							}
							else {
								refRemovedFields.map((refRemovedField) => {
									if (refRemovedField.type === "one-to-one") {
										if (Array.isArray(document[removedField.name])) {
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
	let cloneDoc = Object.__base__clone<mongoose.Document>(doc);
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
	let cloneDoc = Object.__base__clone<mongoose.Document & any>(doc);
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

function replaceSearchKeys(input: object, key: string, replaceKey) {
	if (input && typeof input === "object") {
		let keys = Object.keys(input);
		let keyLength = keys.length;
		for (let i = 0; i < keyLength; i++) {
			if (keys[i] === key) {
				input[replaceKey] = input[key];
				keys[i] = replaceKey;
				i--;
				delete input[key];
			}
			else {
				if (typeof input[keys[i]] === "object") {
					input[keys[i]] = replaceSearchKeys(input[keys[i]], key, replaceKey);
				}
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
			if(this.dbContext.useEventStore){
				let metadatas = namespace.get<IMetadata[]>("metadatas") || [];
				metadatas.push({
					entity: document.modelName,
					entityId: document._id,
					event: type as "REMOVE" | "UPDATE",
					by: "system",
					metadata: data
				})
				namespace.set("metadatas", metadatas);
			}
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
		return null;
	}
	private returnQuery(): mongoose.Query<any> {
		let namespace = this.dbContext.context;
		if (namespace) {
			let query: IDocumentQuery = namespace.get<IDocumentQuery>("query") || {};
			let queryCommand: mongoose.Query<any>;
			if (query.multi) {
				if (query.where) queryCommand = this.model.find(query.where);
				else queryCommand = this.model.find();
				if (!query.limit) {
					if (!query.multi) query.limit = 1;
				}
				if (query.skip) queryCommand = queryCommand.skip(query.skip);
				if (query.limit) queryCommand = queryCommand.limit(query.limit);
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
		return null;
	}
	update(data: T) {
		let query: mongoose.Query<any> = this.returnQuery();
		// this.dbContext.context.remove("query");
		let model = this.model;
		let entity = this.entity;
		let entitySchema = getEntitySchema(entity);

		let changeData = removeId(data);
		let foreignFields = getForeignField(this.entity);
		foreignFields.map((foreignField) => {
			changeData = replaceSearchKeys(changeData as any, foreignField.name, foreignField.localField) as any;
			if (changeData[foreignField.localField] && typeof changeData[foreignField.localField] === "object" && !Array.isArray(changeData[foreignField.localField])) {
				if (changeData[foreignField.localField]._id) {
					changeData[foreignField.localField] = changeData[foreignField.localField]._id;
				}
			}
		});

		return query.exec().then(docs => {
			if (Array.isArray(docs)) {
				let returnPromises = [];
				docs.map(doc => {
					data = generateSet(data, {}, {});
					changeData = generateSet(changeData, {}, {});
					let tempDocument = new model(removeId(doc.toObject())) as mongoose.Document;
					tempDocument.isNew = false;
					tempDocument._id = doc._id;
					if (data) {
						if (data["$set"]) {
							let keys = Object.keys(data["$set"]);
							Object.values(data["$set"]).map((value, index) => {
								tempDocument.set(keys[index], value);
							});
						}
						if (data["$pull"]) {
							let keys = Object.keys(data["$pull"]);
							Object.values(data["$pull"]).map((value: [], index) => {
								let currentValue = tempDocument.get(keys[index]);
								value["$in"].map(v => {
									let index = currentValue.indexOf(v);
									if (index >= 0) currentValue.splice(index, 1);
								});
								tempDocument.set(keys[index], currentValue);
							});
						}
						if (data["$addToSet"]) {
							let keys = Object.keys(data["$addToSet"]);
							Object.values(data["$addToSet"]).map((value: [], index) => {
								let currentValue = tempDocument.get(keys[index]);
								value.map(v => {
									let index = currentValue.indexOf(v);
									if (index < 0) {
										currentValue.push(v);
									}
								});
								tempDocument.set(keys[index], currentValue);
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

					this.setChanges("UPDATE", doc, changeData);
					// delete returnDocument._id;
					let removedFields: TRemovedFieldType[] = generateRemovedFields<any, T>([], getClass(this.entity), tempDocument);
					returnPromises.push(tempDocument.execPopulate().then(doc => {
						removedFields.map(removedField => {
							if (removedField.type === "one-to-one") {
								if (removedField.load === "lazy") {
									tempDocument.set(removedField.name, { _id: doc[removedField.name], id: doc[removedField.name] });
								}
								else {
									if (!tempDocument[removedField.name]) {
										tempDocument.set(removedField.name, doc[removedField.name]);
									}
									else {
										if (typeof doc[removedField.name].toObject === "function") {
											tempDocument.set(removedField.name, doc[removedField.name].toObject());
										}
										else {
											tempDocument.set(removedField.name, doc[removedField.name]);
										}
									}
								}
							}
							tempDocument.set(removedField.localField, undefined);
						});
						return tempDocument.toObject() as Partial<T>;
					}));
				});
				return Promise.all(returnPromises).then((returnDocuments) => {
					if(this.dbContext.useCache) cache.setMaybeClear(model.db.name, model.collection.name);
					return returnDocuments;
				});
			}
			else {
				if (docs) {
					let doc = docs;
					data = generateSet(data, {}, {});
					changeData = generateSet(changeData, {}, {});
					let tempDocument = new model(removeId(doc.toObject())) as mongoose.Document;
					tempDocument.isNew = false;
					tempDocument._id = doc._id;
					if (data) {
						if (data["$set"]) {
							let keys = Object.keys(data["$set"]);
							Object.values(data["$set"]).map((value, index) => {
								tempDocument.set(keys[index], value);
							});
						}
						if (data["$pull"]) {
							let keys = Object.keys(data["$pull"]);
							Object.values(data["$pull"]).map((value: [], index) => {
								let currentValue = tempDocument.get(keys[index]);
								value["$in"].map(v => {
									let index = currentValue.indexOf(v);
									if (index >= 0) currentValue.splice(index, 1);
								});
								tempDocument.set(keys[index], currentValue);
							});
						}
						if (data["$addToSet"]) {
							let keys = Object.keys(data["$addToSet"]);
							Object.values(data["$addToSet"]).map((value: [], index) => {
								let currentValue = tempDocument.get(keys[index]);
								value.map(v => {
									let index = currentValue.indexOf(v);
									if (index < 0) {
										currentValue.push(v);
									}
								});
								tempDocument.set(keys[index], currentValue);
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
					this.setChanges("UPDATE", doc, changeData);
					let removedFields: TRemovedFieldType[] = generateRemovedFields<any, T>([], getClass(this.entity), tempDocument);
					return tempDocument.execPopulate().then(doc => {
						removedFields.map(removedField => {
							if (removedField.type === "one-to-one") {
								if (removedField.load === "lazy") {
									tempDocument.set(removedField.name, { _id: doc[removedField.name], id: doc[removedField.name] });
								}
								else {
									if (!tempDocument[removedField.name]) {
										tempDocument.set(removedField.name, doc[removedField.name]);
									}
									else {
										if (typeof doc[removedField.name].toObject === "function") {
											tempDocument.set(removedField.name, doc[removedField.name].toObject());
										}
										else {
											tempDocument.set(removedField.name, doc[removedField.name]);
										}
									}
								}
							}
							tempDocument.set(removedField.localField, undefined);
						});
						if(this.dbContext.useCache) cache.setMaybeClear(model.db.name, model.collection.name);
						return tempDocument.toObject() as Partial<T>;
					});
				}
				else {
					return docs;
				}
			}
		});
	}
	remove(): Promise<Partial<T> | Partial<T>[]> {
		let query: mongoose.Query<any> = this.returnQuery();
		// this.dbContext.context.remove("query");
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
					if(this.dbContext.useCache) cache.setMaybeClear(this.model.db.name, this.model.collection.name);
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
		// this.dbContext.context.remove("query");
		return query.exec().then(length => Promise.resolve(length)).catch(e => Promise.reject(e));
	}
	select?(what?: string): Promise<IQueryResult<T>> {
		let query = this.returnQuery();
		// let queryInput = Object.__base__clone<IDocumentQuery>(this.dbContext.context.get<IDocumentQuery>("query"));
		// this.dbContext.context.remove("query");
		let cachedResult: Promise<any>;
		if(this.dbContext.useCache) cachedResult = cache.get(this.model.db.name, this.model.collection.name, query);
		else cachedResult = Promise.resolve();
		return cachedResult.then(value => {
			if(value){
				return value;
			}
			else {
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
		
					// if (queryInput.multi) {
					// 	let parsedQuery = toListPromise<T, IBaseEntity<T>>(this.classImp, "query", query, selected || []);
					// 	return parsedQuery.then(value => {
					// 		let queryResult: IQueryResult<T> = {
					// 			end: false,
					// 			numOfRecords: queryInput.limit,
					// 			value: [],
					// 			page: Math.ceil(queryInput.skip / queryInput.limit),
					// 			total: total
					// 		}
					// 		if (value) {
					// 			queryResult.value = value;
					// 			if ((value.length < queryResult.numOfRecords) || (value.length * queryResult.page === queryResult.total)) {
					// 				queryResult.end = true;
					// 			}
					// 		}
					// 		else {
					// 			queryResult.end = true;
					// 		}
					// 		if(this.dbContext.useCache) cache.set(this.model.db.name, this.model.collection.name, query, queryResult);
					// 		return queryResult;
					// 	}).catch(e => Promise.reject(e));
					// }
					// else {
					// 	let parsedQuery = toSinglePromise<T, IBaseEntity<T>>(this.classImp, "query", query, selected);
					// 	return parsedQuery.then(value => {
					// 		let queryResult: IQueryResult<T> = {
					// 			end: false,
					// 			numOfRecords: queryInput.limit,
					// 			value: [],
					// 			page: Math.ceil(queryInput.skip / queryInput.limit),
					// 			total: total
					// 		}
					// 		queryResult.value = [value];
					// 		if (value) {
					// 			queryResult.value = [value];
					// 			queryResult.numOfRecords = 1;
					// 			queryResult.page = 1;
					// 		}
					// 		else {
					// 			queryResult.value = [];
					// 			queryResult.end = true;
					// 		}
					// 		if(this.dbContext.useCache) cache.set(this.model.db.name, this.model.collection.name, query, queryResult);
					// 		return queryResult;
					// 	}).catch(e => Promise.reject(e));
					// }
				});
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
}

export const COLLECTION_SERVICE = "ICollection";

type TQueryable<T> = IQueryable<T, IAfterQueryable<T>, IAfterQueryable<T>>;

function stepPromise(document, hooks) {
	let hook = hooks[0];
	hooks.splice(0, 1);
	return new Promise((resolve, reject) => {
		hook.apply(document, [(err) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(document);
			}
		}]);
	}).then((newDoc) => {
		if (hooks.length > 0) {
			return stepPromise(newDoc, hooks);
		}
		else {
			return newDoc;
		}
	}).catch(e => {
		return Promise.reject(e);
	});
}

@Injectable(COLLECTION_SERVICE, true, true)
export class Collection<K, T extends IBaseEntity<K>> implements ICollection<K, T>{
	clone(): { classImp: new () => T; } {
		throw new Error("Method not implemented.");
	}
	toJSON(): string {
		throw new Error("Method not implemented.");
	}
	init(input: Partial<{ classImp: new () => T; }>): void {
		throw new Error("Method not implemented.");
	}
	getType(): IClassType {
		throw new Error("Method not implemented.");
	}
	constructor() {
	}
	private collectionRestCommand: ICollectionRestCommand<K>;
	private eachAsync(cursor: QueryCursor<mongoose.Document>): IAfterAggregate<K> {
		return (fn: (document: Partial<K>) => any): Promise<boolean> => {
			return cursor.eachAsync((doc) => toSinglePromise(this.classImp, "document", doc, [])).then(() => true);
		};
	}
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
		return null;
	}
	private setChanges(document: mongoose.Document, contextId?: number, documentId?: number, data?: any) {
		let namespace = this.dbContext.context;
		if (namespace) {
			if (contextId || contextId === 0) {
				let specificNamespace = namespace.getById(contextId);
				let documents = specificNamespace.value["documents"];
				if (documents && documents[documentId]) {
					documents[documentId].document = document;
					documents[documentId].data = data;
				}
				specificNamespace.value["documents"] = documents;

				if(this.dbContext.useEventStore){
					let metadatas = specificNamespace.value["metadatas"];
					if (metadatas && metadatas[documentId]){
						metadatas[documentId] = {
							entity: document.modelName,
							entityId: document._id,
							event: "INSERT",
							metadata: document.toObject(),
							by: "system"
						}
					}
					specificNamespace.value["metadatas"] = metadatas;
				}
				namespace.setById(contextId, specificNamespace);
				return {
					contextId: contextId,
					documentId: documentId
				}
			}
			else {
				let session = namespace.get<Promise<mongoose.ClientSession>>("session");
				if (!session) {
					session = this.connection.startSession();
					namespace.set("session", session);
				}
				let documents = namespace.get<IDocumentChange[]>("documents") || [];
				let index = documents.push({ type: "INSERT", document: document, data: data }) - 1;
				namespace.set("documents", documents);

				if(this.dbContext.useEventStore){
					let	metadatas = namespace.get<IMetadata[]>("metadatas") || [];
					metadatas.push({
						entity: document.modelName,
						entityId: document._id,
						event: "INSERT",
						metadata: document.toObject(),
						by: "system"
					})
					namespace.set("metadatas", metadatas);
				}
				return {
					contextId: namespace.getCurrentId(),
					documentId: index
				}
			}
		}
		else {
			throw new Error("DbContext change detector not exists");
		}
		return null;
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
	aggregate(pipelines: any[], options: IAggregateOption = {
		allowDiskUse: false,
		cursor: {
			batchSize: 10,
			useMongooseAggCursor: true
		}
	}): IAfterAggregate<K> {
		let cursor = this.model.aggregate(pipelines).allowDiskUse(options.allowDiskUse).cursor(options.cursor).exec() as QueryCursor<mongoose.Document>;
		return this.eachAsync(cursor);
	}
	insert(doc: Partial<K>): Promise<Partial<K>> {
		doc = removeId(doc);
		try {
			let model = this.model;
			let document = new model(doc);
			let entity = this.entity;
			let entitySchema = getEntitySchema(entity);
			let newDoc = new model(removeId(document.toObject()));
			newDoc._id = document._id;
			newDoc.isNew = false;
			let namespaceContext = this.setChanges(document);
			let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(this.entity), newDoc);
			return newDoc.execPopulate().then(doc => {
				if(this.dbContext.useCache) cache.setMaybeClear(model.db.name, model.collection.name);
				removedFields.map(removedField => {
					if (removedField.type === "one-to-one") {
						if (removedField.load === "lazy") {
							newDoc.set(removedField.name, { _id: doc[removedField.name], id: doc[removedField.name] });
						}
						else {
							if (!newDoc[removedField.name]) {
								newDoc.set(removedField.name, doc[removedField.name]);
							}
							else {
								if (typeof doc[removedField.name].toObject === "function") {
									newDoc.set(removedField.name, doc[removedField.name].toObject());
								}
								else {
									newDoc.set(removedField.name, doc[removedField.name]);
								}
							}
						}
					}
					newDoc.set(removedField.localField, undefined);
				});
				let hooks = [];
				entitySchema.middleware.map(middleware => {
					if (middleware.type === "preDocument") {
						let preDocumentMiddleware = middleware as IFakePreDocument<typeof entity>;
						if (preDocumentMiddleware.hook === "save") {
							hooks.push((<HookSyncCallback<Document & typeof entity>>preDocumentMiddleware.arg0));
						}
					}
				});
				if (hooks.length > 0) {
					return stepPromise(newDoc, hooks).then((newDocument) => {
						newDocument = removeMongooseField(newDocument.toObject());
						let documentKeys = Object.keys(newDocument);
						Object.values(newDocument).map((value, index) => {
							let key = documentKeys[index];
							if (value && (<any>value).id && (<any>value)._id) {
								document[key] = (<any>value)._id;
							}
							else {
								document[key] = value;
							}
						});
						this.setChanges(document, namespaceContext.contextId, namespaceContext.documentId);
						return newDocument;
					});
				}
				else {
					newDoc.id = newDoc._id;
					newDoc = removeMongooseField(newDoc.toObject());
					return newDoc;
				}
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
			let entity = this.entity;
			let entitySchema = getEntitySchema(entity);
			docs.map((doc, index) => {
				let document = new model(doc);
				let newDoc = new model(removeId(document.toObject()));
				newDoc._id = document._id;
				newDoc.isNew = false;
				let namespaceContext = this.setChanges(document);
				let removedFields: TRemovedFieldType[] = generateRemovedFields<K, T>([], getClass(this.entity), newDoc);
				let newDocPromise = newDoc.execPopulate().then(doc => {
					removedFields.map(removedField => {
						if (removedField.type === "one-to-one") {
							if (removedField.load === "lazy") {
								newDoc.set(removedField.name, { _id: doc[removedField.name], id: doc[removedField.name] });
							}
							else {
								if (!newDoc[removedField.name]) {
									newDoc.set(removedField.name, doc[removedField.name]);
								}
								else {
									if (typeof doc[removedField.name].toObject === "function") {
										newDoc.set(removedField.name, doc[removedField.name].toObject());
									}
									else {
										newDoc.set(removedField.name, doc[removedField.name]);
									}
								}
							}
						}
						newDoc.set(removedField.localField, undefined);
					});
					let hooks = [];
					entitySchema.middleware.map(middleware => {
						if (middleware.type === "preDocument") {
							let preDocumentMiddleware = middleware as IFakePreDocument<typeof entity>;
							if (preDocumentMiddleware.hook === "save") {
								hooks.push((<HookSyncCallback<Document & typeof entity>>preDocumentMiddleware.arg0));
							}
						}
					});
					if (hooks.length > 0) {
						return stepPromise(newDoc, hooks).then((newDocument) => {
							newDocument = removeMongooseField(newDocument.toObject());
							let documentKeys = Object.keys(newDocument);
							Object.values(newDocument).map((value, index) => {
								let key = documentKeys[index];
								if (value && (<any>value).id && (<any>value)._id) {
									document[key] = (<any>value)._id;
								}
								else {
									document[key] = value;
								}
							});
							this.setChanges(document, namespaceContext.contextId, namespaceContext.documentId);
							return newDocument;
						});
					}
					else {
						newDoc.id = newDoc._id;
						newDoc = removeMongooseField(newDoc.toObject());
						return newDoc;
					}
				});
				documents.push(newDocPromise);
			});
			return Promise.all(documents).then(returnDocuments => {
				if(this.dbContext.useCache) cache.setMaybeClear(model.db.name, model.collection.name);
				return returnDocuments;
			});
		}
		catch (e) {
			throw e;
		}
	}
}

export * from "@app/main/database-context/collection/decorator";