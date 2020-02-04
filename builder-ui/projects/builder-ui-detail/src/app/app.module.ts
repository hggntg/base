import { BrowserModule } from '@angular/platform-browser';
import { NgModule, DoBootstrap, Injector } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { createCustomElement } from '@angular/elements';
import { FormsModule } from '@angular/forms';

import { DetailComponent } from './app.component';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    DetailComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule
  ],
  providers: [],
  entryComponents: [DetailComponent],
  bootstrap: !environment.production ? [DetailComponent] : undefined
})
export class DetailModule implements DoBootstrap {
  constructor(private injector: Injector) { }
  ngDoBootstrap() {
    const el = createCustomElement(DetailComponent, { injector: this.injector });
    customElements.define("builder-ui-detail", el);
  }
}
