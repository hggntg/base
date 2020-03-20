import mongoose from "mongoose";
export const BASE_ENTITY_SERVICE = "IBaseEntity";

export interface IBaseEntity<T = any> extends IBaseClass<T> {
	getInstance(): any;
}

export type IEntityIdProperty<T> = T;
export type EntityProperty<T> = T;
export type DataSourceConnection<T = any> = T;
export type DataSource<T = any> = T;
export interface IEntityProperty<T>{
    value: T;
}
export type EntityResult<T> = ResultTypeWrapper<IEntityProperty<T>>;
export type EntityArrayResult<T> = ResultTypeWrapper<IEntityProperty<T>[]>;

export interface IEntitySchemaField {
    type: string;
}

type EntitySchemaType<T> = {
    [P in keyof T]: IEntitySchemaField;
}

export interface IEntitySchemaBehavior<T> {
    set(key: string, value: EntitySchemaType<T> | IEntitySchemaField): void;
}

export class EntitySchemaField extends BaseClass<IEntitySchemaField> implements IEntitySchemaField {
    type: string;
}

export interface IEntitySchemaData<T>{
    data: EntitySchemaType<T>;
}
export interface IEntitySchema<T> extends IEntitySchemaData<T>, IEntitySchemaBehavior<T> {}

export class EntitySchema<T> implements IEntitySchema<T> {
    data: EntitySchemaType<T>;
    set(key: string, value: EntitySchemaType<T> | IEntitySchemaField): void{
        this.data[key] = value;
    }
    constructor(){
        this.data = {} as EntitySchemaType<T>;
    }
}

export interface IEntityBehavior<T> {
    dataSource: DataSource;
    schema: EntitySchemaType<T>;
    find(condition: object): Promise<EntityArrayResult<T>>;
    findOne(condition: IEntityIdProperty<T> | object): Promise<EntityResult<T>>;
    update(condition: object, datas: IEntityProperty<T>[]): Promise<EntityArrayResult<T>>;
    updateOne(condition: IEntityIdProperty<T> | object, data: IEntityProperty<T>): Promise<EntityResult<T>>;
    updateMany(conditions: object[], datas: IEntityProperty<T>[]): Promise<EntityArrayResult<T>>;
    insert(datas: IEntityProperty<T>[]): Promise<EntityArrayResult<T>>;
    insertOne(data: IEntityProperty<T>): Promise<EntityResult<T>>;
    remove(condition: object): Promise<ResultTypeWrapper<void>>;
    removeOne(condition: IEntityIdProperty<T> | object): Promise<ResultTypeWrapper<void>>;
    bulk(operations): Promise<EntityArrayResult<T>>;
}
export interface IEntity<T> extends IEntityProperty<T>, IEntityBehavior<T> {}


// @Injectable(BASE_ENTITY_SERVICE, true, true)
// export abstract class BaseEntity<T> extends BaseClass<T> implements IBaseEntity<T>{
// 	getType(): IClassType {
// 		throw new Error("Method not implemented.");
// 	}
// 	public getInstance(): mongoose.Model<mongoose.Document & T>{
// 		let classImp = getClass(this);
// 		let entitySchema: IEntitySchema<typeof classImp> = getEntitySchema<typeof classImp>(classImp);
// 		return entitySchema.model as mongoose.Model<mongoose.Document & T>;
// 	}
// 	initValue(input: Partial<T>){
// 		if(input){
// 			let result = mapData<T>(getClass(this), input);
// 			Object.keys(result).map(key => {
// 				this[key] = result[key];
// 			});
// 		}
// 	}
// }

abstract class BaseEntity<T> implements IEntity<T> {
    abstract dataSource: DataSource;
    abstract value: T;
    abstract schema: EntitySchemaType<T>;
    abstract find(condition: object): Promise<EntityArrayResult<T>>;
    abstract findOne(condition: object | T): Promise<EntityResult<T>>;
    abstract update(condition: object, datas: IEntityProperty<T>[]): Promise<EntityArrayResult<T>>;
    abstract updateOne(condition: object | T, data: IEntityProperty<T>): Promise<EntityResult<T>>;
    abstract updateMany(conditions: object[], datas: IEntityProperty<T>[]): Promise<EntityArrayResult<T>>;
    abstract insert(datas: IEntityProperty<T>[]): Promise<EntityArrayResult<T>>;
    abstract insertOne(data: IEntityProperty<T>):  Promise<EntityResult<T>>;
    abstract remove(condition: object): Promise<ResultTypeWrapper<void>>;
    abstract removeOne(condition: object | T): Promise<ResultTypeWrapper<void>>;
    abstract bulk(operations: any): Promise<EntityArrayResult<T>>;
    constructor(connection: DataSourceConnection, name: string, schema: mongoose.Schema){}
}

export class MongooseBaseEntity<T> extends BaseEntity<T> {
    dataSource: DataSource<mongoose.Model<mongoose.Document & T>>;
    value: T;
    schema: EntitySchemaType<T>;
    find(condition: object): Promise<EntityArrayResult<mongoose.Document["_id"] & T>> {
        return this.dataSource.find(condition).exec().then((dataResult) => {
            let documents: EntityArrayResult<mongoose.Document["_id"] & T> = [];
            dataResult.map(data => {
                (<IEntityProperty<mongoose.Document["_id"] & T>[]>documents).push({
                    value: data.toObject()
                });
            });
            return documents;
        }).catch(e => {
            return Promise.reject(handleError(e));
        });
    }    
    findOne(condition: object | (mongoose.Document & T)): Promise<EntityResult<mongoose.Document & T>> {
        throw new Error("Method not implemented.");
    }
    update(condition: object, datas: IEntityProperty<mongoose.Document & T>[]): Promise<EntityArrayResult<mongoose.Document & T>> {
        throw new Error("Method not implemented.");
    }
    updateOne(condition: object | (mongoose.Document & T), data: IEntityProperty<mongoose.Document & T>): Promise<EntityResult<mongoose.Document & T>> {
        throw new Error("Method not implemented.");
    }
    updateMany(conditions: object[], datas: IEntityProperty<mongoose.Document & T>[]): Promise<EntityArrayResult<mongoose.Document & T>> {
        throw new Error("Method not implemented.");
    }
    insert(datas: IEntityProperty<Partial<mongoose.Document["_id"]> & T>[]): Promise<EntityArrayResult<mongoose.Document["_id"] & T>> {
        let documents:  (mongoose.Document["_id"] & T)[] = [];
        datas.map(data => {
            documents.push(data.value as mongoose.Document["_id"] & T);
        });
        datas = [];
        return this.dataSource.insertMany(documents).then(dataResults => {
            dataResults.map(data => {
                datas.push({
                    value: data.toObject()
                });
            });
            return datas;
        });
    }
    insertOne(data: IEntityProperty<mongoose.Document["_id"] & T>): Promise<EntityResult<mongoose.Document["_id"] & T>> {
        let document: (mongoose.Document["_id"] & T);
        document = data.value;
        return this.dataSource.create(document).then((dataResult) => {
            data.value = dataResult.toObject();
            return data;
        });
    }
    remove(condition: object): Promise<ResultTypeWrapper<void>> {
        throw new Error("Method not implemented.");
    }
    removeOne(condition: object | (mongoose.Document & T)): Promise<ResultTypeWrapper<void>> {
        throw new Error("Method not implemented.");
    }
    bulk(operations: any): Promise<EntityArrayResult<mongoose.Document & T>> {
        throw new Error("Method not implemented.");
    }
    constructor(dataSourceConnection: DataSourceConnection<typeof mongoose>, name: string, schema: mongoose.Schema){
        super(dataSourceConnection, name, schema);
        this.dataSource = dataSourceConnection.model(name, schema);
        let entitySchema: IEntitySchema<T> = new EntitySchema();
        let objKeys = Object.keys(this.dataSource.schema.obj);
        Object.values(this.dataSource.schema.obj).map((objValue, index) => {
            if((<any>objValue).type){
                entitySchema.set(objKeys[index], {
                    type: (<any>objValue).type.name
                });
            }
        });
        this.schema = entitySchema.data;
    }
}