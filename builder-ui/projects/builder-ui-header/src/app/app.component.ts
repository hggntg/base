import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class HeaderComponent {
  @Output('logout') logout: EventEmitter<void> = new EventEmitter();
  @Output('back') goBack: EventEmitter<void> = new EventEmitter();
  @Input('head-title') headTitle: string = 'Dashboard';
  @Input('is-home') isHome: string = 'false';

  back(){
    this.goBack.emit();
  }

  signout(){
    this.logout.emit();
  }
}
