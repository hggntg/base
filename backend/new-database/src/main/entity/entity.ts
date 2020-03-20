type EntityStatus = "draft" | "save";
interface IEntityProperty<T>{
    status: EntityStatus;
    value: T;
}

interface IEntityBehavior<T> {
    setValue(_value: Partial<T>): void;
    setState(status: EntityStatus): void;
}

export interface IEntity<T> extends IEntityProperty<T>, IEntityBehavior<T>{}

export abstract class BaseEntity<T> extends BaseClass<IEntityProperty<T>> implements IEntity<T>{
    @Property(String)
    status: EntityStatus;    
    @Property(Object)
    value: T;
    init(input: Partial<IEntityProperty<T>>): void {
        super.init(input);
    }
    setValue(_value: Partial<T>): void {
        this.value = mapData(getClass(_value), _value);
    }
    setState(status: EntityStatus): void {
        this.status = status;
    }
}