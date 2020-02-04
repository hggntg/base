import { BrowserModule } from '@angular/platform-browser';
import { NgModule, DoBootstrap, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';

import { environment } from '../environments/environment';
import { ListComponent } from './app.component';

@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatTableModule
  ],
  providers: [],
  entryComponents: [ListComponent],
  bootstrap: !environment.production ? [ListComponent] : undefined
})
export class ListModule implements DoBootstrap {
  constructor(private injector: Injector) { }
  ngDoBootstrap() {
    const el = createCustomElement(ListComponent, { injector: this.injector });
    customElements.define("builder-ui-list", el);
  }
}
