import { Observable } from 'tns-core-modules/data/observable';
import { Arcore } from "nativescript-arcore"

export class HelloWorldModel extends Observable {
  public message: string;
  private arcore: Arcore;

  constructor() {
    super();

    this.arcore = new Arcore();
  }

  show(){
    let check = this.arcore.checkAvaibility();
    console.log(check);
    if(check){
      this.arcore.show();
    }
  }
  
}
