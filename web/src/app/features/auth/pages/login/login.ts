import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  email = '';
  password = '';

  constructor(private router: Router) { }

  onSubmit() {
    this.router.navigate(['/catalog']);
  }
}
