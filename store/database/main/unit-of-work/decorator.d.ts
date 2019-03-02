import { ICollection } from "../database-context/collection";
import { IBaseEntity, IBaseRepository } from "@base/interfaces";
export interface IUnitOfWorkMetadata {
    classes: {
        [key: string]: {
            new (_collection: ICollection<IBaseEntity>): IBaseRepository<IBaseEntity>;
        };
    };
}
export declare function getUnitOfWorkMetadata(target: any): IUnitOfWorkMetadata;
