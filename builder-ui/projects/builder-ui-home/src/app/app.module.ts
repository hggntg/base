import { environment } from "../environments/environment";
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector, DoBootstrap } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { HomeComponent } from './app.component';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatCardModule,
  ],
  providers: [],
  entryComponents: [HomeComponent],
  bootstrap: !environment.production ? [HomeComponent] : undefined
})
export class HomeModule implements DoBootstrap {
  constructor(private injector: Injector) { }
  ngDoBootstrap() {
    const el = createCustomElement(HomeComponent, { injector: this.injector });
    customElements.define("builder-ui-home", el);
  }
}
