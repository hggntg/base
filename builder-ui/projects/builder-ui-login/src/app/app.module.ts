import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector, DoBootstrap } from '@angular/core';
import { createCustomElement } from "@angular/elements";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from "@angular/material/grid-list";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { LoginComponent } from './app.component';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  providers: [],
  entryComponents: [LoginComponent],
  bootstrap: !environment.production ? [LoginComponent] : undefined
})
export class LoginModule implements DoBootstrap {
  constructor(private injector: Injector) { }
  ngDoBootstrap() {
    const element = createCustomElement(LoginComponent, { injector: this.injector });
    customElements.define("builder-ui-login", element);
  }
}
