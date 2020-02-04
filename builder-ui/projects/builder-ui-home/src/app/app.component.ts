import { Component, Input, OnChanges, OnInit, EventEmitter, Output, HostListener } from '@angular/core';
import { environment } from '../environments/environment';

interface IModuleList {
  name: string,
  itemCount: number
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class HomeComponent implements OnChanges, OnInit{
  @Input('module-list') moduleListString: string = "[]";
  @Output('choose') onChoose: EventEmitter<number> = new EventEmitter();
  
  cols: number = 5;
  moduleList: IModuleList[] = [];
  title = 'builder-ui-home';

  constructor(){
    if(!environment.production){
      this.moduleListString = JSON.stringify([
        {name: "User", itemCounts: 100000},
        {name: "Order", itemCounts: 50000},
        {name: "Order Item", itemCounts: 800000},
        {name: "User Attribute", itemCounts: 100000000},
        {name: "Product", itemCounts: 1000},
        {name: "User", itemCounts: 100000},
        {name: "Order", itemCounts: 50000},
        {name: "Order Item", itemCounts: 800000},
        {name: "User Attribute", itemCounts: 100000000},
        {name: "Product", itemCounts: 1000}
      ]);
    }
    this.changeColumn(window);
  }

  private findNode(current, nodeName){
    if(current){
      if(current.nodeName === nodeName){
        return current;
      }
      else {
        return this.findNode(current.parentNode, nodeName);
      }
    }
    else {
      return undefined;
    }
  }

  choose(event){
    let target = this.findNode(event.target, "MAT-CARD");
    if(target){
      let index = target.getAttribute("id");
      if(index || index === 0){
        this.onChoose.emit(index);
      }
    }
  }

  ngOnInit(){
    try{
      this.moduleList = JSON.parse(this.moduleListString);
    }
    catch(e){
      console.error(e);
    }
  }

  ngOnChanges(){
    try{
      this.moduleList = JSON.parse(this.moduleListString);
    }
    catch(e){
      console.error(e);
    }
  }

  private changeColumn(target) {
    if(target.innerWidth < 512){
      this.cols = 1;
    }
    else if(target.innerWidth < 768){
      this.cols = 2;
    }
    else if(target.innerWidth < 1024){
      this.cols = 3;
    }
    else if(target.innerWidth < 1368){
      this.cols = 4;
    }
    else if(target.innerWidth < 1768){
      this.cols = 5;
    }   
    else {
      this.cols = 6;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeColumn(event.target);
  }
}
