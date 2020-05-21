import { ICollection, IBaseEntity, IBaseRepository, IWherable, IQueryable, IRepositoryAfterQueryable, IRepositoryQuery, IRepositoryRestCommand, IDbContextMetadata, IQueryResult, IRepositoryRestCommandableForOne, IAggregateOption, IAfterAggregate } from "@app/interface";
import { COLLECTION_SERVICE, getDbContextMetadata } from "@app/main/database-context";
import { getRepositoryMetadata } from "@app/main/repository/decorator";
import { getCollectionMetadata } from "@app/main/database-context/collection/decorator";

export const BASE_REPOSITORY_SERVICE = "IBaseRepository";

export class RepositoryRestCommandForOne<K, T extends IBaseEntity<K>> implements IRepositoryRestCommandableForOne<K>{
	private dbContext: IDbContextMetadata;
	private collection: ICollection<K, T>;
	private returnQuery(): IRepositoryQuery {
		let namespace = this.dbContext.context;
		if (namespace) {
			let repositoryQuery: IRepositoryQuery = Object.__base__clone<T>((namespace.get<IRepositoryQuery>("repository-query") || {}) as T);
			namespace.remove("repository-query");
			return repositoryQuery;
		}
		else throw new Error("DbContext change detector not exists");
	}
	update(data: K): Promise<Partial<K>> {
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
				if (query) return query["update"](data);
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
	remove(): Promise<Partial<K>> {
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
				if (query) return query["remove"]();
				else throw new Error("DbContext change detector not exists")
			}
			else throw new Error("DbContext change detector not exists");
		}
		catch (e) {
			throw e;
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

export class RepositoryRestCommand<K, T extends IBaseEntity<K>> implements IRepositoryRestCommand<K, T> {
	private dbContext: IDbContextMetadata;
	private collection: ICollection<K, T>;
	private returnQuery(): IRepositoryQuery {
		let namespace = this.dbContext.context;
		if (namespace) {
			let repositoryQuery: IRepositoryQuery = Object.__base__clone<IRepositoryQuery>(namespace.get<IRepositoryQuery>("repository-query") || {});
			namespace.remove("repository-query");
			return repositoryQuery;
		}
		else {
			throw new Error("DbContext change detector not exists");
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
				if (query){
					if(what) return query["select"](what);
					return query["select"]();
				}
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

type TQueryable<T> = IQueryable<T, IRepositoryAfterQueryable<T>, IRepositoryRestCommandableForOne<T>>;

@Injectable(BASE_REPOSITORY_SERVICE, true, true)
export class BaseRepository<K, T extends IBaseEntity<K>> implements IBaseRepository<K, T>{
	protected collection: ICollection<K, T>;
	constructor() {
		let repositoryMetadata = getRepositoryMetadata<K, T>(this);
		if (repositoryMetadata && repositoryMetadata.entity) {
			this.collection = getConstant<ICollection<K, T>>(COLLECTION_SERVICE, `Collection<${repositoryMetadata.entity.name}>`);
		}
		this.repositoryCommand = new RepositoryRestCommand(this.dbContext, this.collection);
		this.repositoryCommandOne = new RepositoryRestCommandForOne(this.dbContext, this.collection);
	}
	private repositoryCommand: IRepositoryRestCommand<K, T>;
	private repositoryCommandOne: IRepositoryRestCommandableForOne<K>;
	private get dbContext() {
		let repositoryMetadata = getRepositoryMetadata<K, T>(this);
		let collectionMetadata = repositoryMetadata ? getCollectionMetadata(repositoryMetadata.entity) : null;
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
	where(conditions: any): IWherable<K, IRepositoryAfterQueryable<K>, IRepositoryRestCommandableForOne<K>> {
		this.buildQuery("where", conditions);
		return this as any;
	}
	find(): IRepositoryAfterQueryable<K> {
		this.buildQuery("find", null);
		return this.repositoryCommand;
	}
	findOne(): IRepositoryRestCommandableForOne<K> {
		this.buildQuery("findOne", null);
		return this.repositoryCommandOne;
	}
	aggregate(pipelines: any[], options?: IAggregateOption): IAfterAggregate<K>{
		return this.collection.aggregate(pipelines, options);
	}
	insert(document: Partial<K>): Promise<Partial<K>> {
		return this.collection.insert(document);
	}
	insertMany(documents: Partial<K>[]): Promise<Partial<K>[]> {
		return this.collection.insertMany(documents);
	}
}

export * from "@app/main/repository/decorator";