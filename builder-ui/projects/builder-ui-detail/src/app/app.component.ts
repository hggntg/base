import { Component, OnChanges, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { environment } from '../environments/environment';

interface IProperty{
  field: string,
  rawValue: any,
  value: any,
  type: "input" | "textarea",
  disabled?: boolean,
  changed?: boolean,
  hidden?: boolean
}

interface IOutput {
  status: "changed" | "not-changed",
  value: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class DetailComponent implements OnInit, OnChanges{
  @Input("data") data: string;
  @Output("save") onSave: EventEmitter<IOutput> = new EventEmitter();

  displayData: IProperty[] = [];

  constructor(){
    if(!environment.production){
      this.displayData = [
        {
          field: "id",
          rawValue: "THISISID",
          value: "THISISID",
          type: "input",
          disabled: true
        },
        {
          field: "name",
          rawValue: "Ngô Đông Hồng",
          value: "Ngô Đông Hồng",
          type: "input"
        },
        {
          field: "custom",
          rawValue: "What is Lorem Ipsum?\nLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
          value: "What is Lorem Ipsum?\nLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
          type: "textarea"
        }
      ]
    }
  }

  dataChange(data){
    if(data.value !== data.rawValue){
      data.changed = true;
    }
    else {
      data.changed = false;
    }
  }

  save(){
    let changed = false;
    let length = this.displayData.length;
    let value = {}
    for(let i = 0; i < length; i++){
      let data = this.displayData[i];
      if(!changed && data.changed){
        changed = true;
      }
      value[this.displayData[i].field] = this.displayData[i].value;      
    }
    let output: IOutput = {
      status: changed ? "changed" : "not-changed",
      value: value
    }
    this.onSave.emit(output);
  }

  ngOnInit(){
    if(this.data){
      try{
        this.displayData = JSON.parse(this.data);
      }
      catch(e){
        console.error(e);
      }
    }
  }
  ngOnChanges(){
    if(this.data){
      try{
        this.displayData = JSON.parse(this.data);
      }
      catch(e){
        console.error(e);
      }
    }
  }
}
