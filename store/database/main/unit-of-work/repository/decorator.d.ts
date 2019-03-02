import { IBaseRepository, IBaseEntity } from "@base/interfaces";
import { ICollection } from "../../database-context/collection";
export declare function RepositoryProperty<T extends IBaseRepository<IBaseEntity>>(classImp: {
    new (_collection: ICollection<IBaseEntity>): T;
}): (target: any, propertyKey: string) => void;
