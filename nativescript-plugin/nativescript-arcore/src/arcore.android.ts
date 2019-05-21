import { Common } from './arcore.common';
import * as application from "tns-core-modules/application";
export class Arcore extends Common {
    private arcoreIns: any;
    private context: any;
    constructor(){
        super();
        this.context = application.android.context;
        this.arcoreIns = new (<any>org).base.augmented_reality_core.ARCore();
    }
    show(){
        this.arcoreIns.show(this.context);
    }
    checkAvaibility(): boolean{
        return this.arcoreIns.checkAvaibility(this.context);
    }
}
