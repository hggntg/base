import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector, DoBootstrap, Output } from '@angular/core';

import { HeaderComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../environments/environment';
import { createCustomElement } from '@angular/elements';

@NgModule({
  declarations: [
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [],
  entryComponents: [HeaderComponent],
  bootstrap: !environment.production ? [HeaderComponent] : undefined
})
export class HeaderModule implements DoBootstrap {
  constructor(private injector: Injector) { }
  ngDoBootstrap() {
    const el = createCustomElement(HeaderComponent, { injector: this.injector });
    customElements.define("builder-ui-header", el);
  }
}
