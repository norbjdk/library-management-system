import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  mode = signal<'login' | 'register'>('login');
  email = '';
  password = '';
  registration = {
    first_name: '',
    last_name: '',
    email: '',
    birthdate: '',
    password: '',
    confirmPassword: '',
  };
  error = signal<string | null>(null);
  loading = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
    this.error.set(null);
    this.loading.set(false);
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Podaj email i hasło.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/catalog'], { replaceUrl: true });
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Nieprawidłowe dane logowania.');
        this.loading.set(false);
      },
    });
  }

  onRegister() {
    const { first_name, last_name, email, birthdate, password, confirmPassword } =
      this.registration;

    if (!first_name || !last_name || !email || !birthdate || !password || !confirmPassword) {
      this.error.set('Uzupełnij wszystkie pola rejestracji.');
      return;
    }

    if (password !== confirmPassword) {
      this.error.set('Hasła muszą być identyczne.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .register({
        first_name,
        last_name,
        email,
        birthdate,
        password,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/catalog'], { replaceUrl: true });
        },
        error: (err) => {
          this.error.set(
            err?.error?.detail ?? err?.error?.email?.[0] ?? 'Nie udało się utworzyć konta.',
          );
          this.loading.set(false);
        },
      });
  }
}
