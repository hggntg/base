export class Lib implements IBaseClass {
    getType(): IClassType {
        throw new Error("Method not implemented.");
    }
    name: string;
    value: number;
    id: string;
}