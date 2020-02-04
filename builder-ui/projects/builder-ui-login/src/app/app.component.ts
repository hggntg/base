import { Component, ViewEncapsulation, Output, EventEmitter, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { environment } from '../environments/environment';

interface ILoginUser {
  email: string;
  password: string
}

@Component({
  selector: 'builder-ui-login',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class LoginComponent {
  @Input("login-status") loginStatus: string = "true";
  @Input('loading') loading: string = 'false';
  @Output("logged-in") loggedIn = new EventEmitter<ILoginUser>();

  title = 'builder-ui-login';
  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required]);
  hide = true;

  getErrorMessage(type: "email" | "password") {
    if (type === "email") {
      return this.email.hasError('required') ? 'Missing email' : this.email.hasError('email') ? 'Invalid email' : '';
    }
    else {
      return this.password.hasError('required') ? 'Missing password' : '';
    }
  }
  login() {
    if (this.loading === 'false') {
      this.loginStatus = "true";
      this.loading = "true";
      if (this.email.valid && this.password.valid) {
        let loginUser: ILoginUser = {
          email: this.email.value,
          password: this.password.value
        }
        this.loggedIn.emit(loginUser);
        if (!environment.production) {
          setTimeout(() => {
            this.loading = "false";
          }, 5000);
        }
      }
    }
  }
}
