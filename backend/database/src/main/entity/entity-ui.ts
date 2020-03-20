import { IEntityUI, IFieldUI, IFieldUIList, IEntityUIList, IUnitOfWorkUI } from "@app/interface";
import { UI_KEY } from "@app/infrastructure/constant";

export class FieldUI implements IFieldUI {
    @Property(String)
    name: string;    
    @Property(String)
    type: "input" | "textarea";
    @Property(Boolean)
    hidden?: boolean;
    @Property(Boolean)
    disabled?: boolean;
}

@DynamicProperty(FieldUI)
export class FieldUIList implements IFieldUIList {
    [key: string]: FieldUI;
}

export class EntityUI implements IEntityUI{
    @Property(String)
    name: string;    
    @Property(String)
    slug: string;
    @Property(PropertyArray(String))
    columns: string[];
    fields: IFieldUIList;
    constructor(){
        this.fields = {};
        this.columns = [];
    }
}

export function getEntityUI(target: any): IEntityUI {
	let classImp = getClass(target);
	let entityUI = getMetadata<IEntityUI>(UI_KEY, classImp) || new EntityUI();
	return entityUI;
}

export function getEntityUIList(target: any): IEntityUIList {
    let classImp = getClass(target);
    let entityUIList = getMetadata<IEntityUIList>(UI_KEY, classImp) || { entities: {} } as IEntityUIList;
    return entityUIList;
}

export function getUnitOfWorkUI(target: any): IUnitOfWorkUI {
    let classImp = getClass(target);
    let unitOfWorkUI = getMetadata<IUnitOfWorkUI>(UI_KEY, classImp) || { uow: undefined, repositories: {}, entityUIList: {}} as IUnitOfWorkUI;
    return unitOfWorkUI;
}