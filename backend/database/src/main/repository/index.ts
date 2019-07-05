import { ICollection, IBaseEntity, IBaseRepository, IWherable, IQueryable, IRepositoryAfterQueryable, IRepositoryQuery, IRepositoryRestCommand, IDbContextMetadata, IQueryResult } from "../../interface";
import { Injectable, getDependency, getConstant } from "@base/class";
import { COLLECTION_SERVICE, getDbContextMetadata } from "../database-context";
import { getRepositoryMetadata } from "./decorator";
import { getCollectionMetadata } from "../database-context/collection/decorator";

export const BASE_REPOSITORY_SERVICE = "IBaseRepository";


export class RepositoryRestCommand<K, T extends IBaseEntity<K>> implements IRepositoryRestCommand<K, T> {
	private dbContext: IDbContextMetadata;
	private collection: ICollection<K, T>;
	private returnQuery(): IRepositoryQuery {
		let namespace = this.dbContext.context;
		if (namespace) {
			let repositoryQuery: IRepositoryQuery = Object.assign({}, namespace.get<IRepositoryQuery>("repository-query") || {});
			namespace.remove("repository-query");
			return repositoryQuery;
		}
		else {
			throw new Error("DbContext change detector not exists");
		}
	}
	update(data: K): void {
		try {
			let repositoryQuery = this.returnQuery();
			let query = null;
			if (repositoryQuery) {
				let keys = Object.keys(repositoryQuery);
				Object.values(repositoryQuery).map((queryData, index) => {
					if (queryData !== null && queryData !== undefined) {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]](queryData);
					}
					else {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]]();
					}
				});
				if (query) query["update"](data);
				else throw new Error("DbContext change detector not exists")
			}
			else {
				throw new Error("DbContext change detector not exists");
			}
		}
		catch (e) {
			throw e;
		}
	}
	remove(): void {
		try {
			let repositoryQuery = this.returnQuery();
			let query = null;
			if (repositoryQuery) {
				let keys = Object.keys(repositoryQuery);
				Object.values(repositoryQuery).map((queryData, index) => {
					if (queryData !== null && queryData !== undefined) {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]](queryData);
					}
					else {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]]();
					}
				});
				if (query) query["remove"]();
				else throw new Error("DbContext change detector not exists")
			}
			else {
				throw new Error("DbContext change detector not exists");
			}
		}
		catch (e) {
			throw e;
		}
	}
	select?(what?: string): Promise<IQueryResult<K>> {
		try {
			let repositoryQuery = this.returnQuery();
			let query = null;
			if (repositoryQuery) {
				let keys = Object.keys(repositoryQuery);
				Object.values(repositoryQuery).map((queryData, index) => {
					if (queryData !== null && queryData !== undefined) {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]](queryData);
					}
					else {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]]();
					}
				});
				if (query) return query["select"](what);
				else return Promise.reject("DbContext change detector not exists")
			}
			else {
				throw new Error("DbContext change detector not exists");
			}
		}
		catch (e) {
			return Promise.reject(e);
		}
	}
	count?<Q extends IRepositoryRestCommand<K, T>>(): Promise<number> {
		try {
			let repositoryQuery = this.returnQuery();
			let query = null;
			if (repositoryQuery) {
				let keys = Object.keys(repositoryQuery);
				Object.values(repositoryQuery).map((queryData, index) => {
					if (queryData !== null && queryData !== undefined) {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]](queryData);
					}
					else {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]]();
					}
				});
				if (query) return query["count"]();
				else return Promise.reject("DbContext change detector not exists")
			}
			else {
				throw new Error("DbContext change detector not exists");
			}
		}
		catch (e) {
			return Promise.reject(e);
		}
	}
	then<TResult1 = IQueryResult<K>, TResult2 = never>(
		onfulfilled?: (value: IQueryResult<K>) => TResult1 | PromiseLike<TResult1>,
		onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
	): Promise<TResult1 | TResult2> {
		try {
			let repositoryQuery = this.returnQuery();
			let query = null;
			if (repositoryQuery) {
				let keys = Object.keys(repositoryQuery);
				Object.values(repositoryQuery).map((queryData, index) => {
					if (queryData !== null && queryData !== undefined) {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]](queryData);
					}
					else {
						if (query) query = query[keys[index]](queryData);
						else query = this.collection[keys[index]]();
					}
				});
				if (query) return query["then"](onfulfilled, onrejected);
				else return Promise.reject("DbContext change detector not exists");
			}
			else {
				throw new Error("DbContext change detector not exists");
			}
		}
		catch (e) {
			return Promise.reject(e);
		}
	}
	constructor(_dbContext: IDbContextMetadata, _collection: ICollection<K, T>) {
		this.dbContext = _dbContext;
		this.collection = _collection;
	}
}

type TQueryable<T> = IQueryable<T, IRepositoryAfterQueryable<T>>;

@Injectable(BASE_REPOSITORY_SERVICE, true, true)
export class BaseRepository<K, T extends IBaseEntity<K>> implements IBaseRepository<K, T>{
	protected collection: ICollection<K, T>;
	constructor() {
		let repositoryMetadata = getRepositoryMetadata<K, T>(this);
		if (repositoryMetadata && repositoryMetadata.entity) {
			this.collection = getConstant<ICollection<K, T>>(COLLECTION_SERVICE, `Collection<${repositoryMetadata.entity.name}>`);
		}
		this.repositoryCommand = new RepositoryRestCommand(this.dbContext, this.collection);
	}
	private repositoryCommand: IRepositoryRestCommand<K, T>;
	private get dbContext() {
		let repositoryMetadata = getRepositoryMetadata<K, T>(this);
		let collectionMetadata = getCollectionMetadata(repositoryMetadata.entity);
		let dbContextMetadata = getDbContextMetadata(collectionMetadata.dbContextClass);
		return dbContextMetadata;
	}

	private buildQuery(queryKey, queryData) {
		let namespace = this.dbContext.context;
		if (namespace) {
			let repositoryQuery: IRepositoryQuery = namespace.get<IRepositoryQuery>("repository-query") || {};
			repositoryQuery[queryKey] = queryData;
			namespace.set("repository-query", repositoryQuery);
		}
		else {
			throw new Error("DbContext change detector not exists");
		}
	}

	limit?<Q extends TQueryable<K>>(about: number): Pick<Q, Exclude<keyof Q, "limit">> {
		this.buildQuery("limit", about);
		return this as any;
	}
	skip?<Q extends TQueryable<K>>(about: number): Pick<Q, Exclude<keyof Q, "skip">> {
		this.buildQuery("skip", about);
		return this as any;
	}
	sort?<Q extends TQueryable<K>>(conditions: any): Pick<Q, Exclude<keyof Q, "sort">> {
		this.buildQuery("sort", conditions);
		return this as any;
	}
	where(conditions: any): IWherable<K, IRepositoryAfterQueryable<K>> {
		this.buildQuery("where", conditions);
		return this as any;
	}
	find(): IRepositoryAfterQueryable<K> {
		this.buildQuery("find", null);
		return this.repositoryCommand;
	}
	findOne(): IRepositoryAfterQueryable<K> {
		this.buildQuery("findOne", null);
		return this.repositoryCommand;
	}
	insert(document: Partial<K>): void {
		this.collection.insert(document);
	}
	insertMany(documents: Partial<K>[]): void {
		this.collection.insertMany(documents);
	}
}

export * from "./decorator";