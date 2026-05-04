import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import {
  getTodayIsoDate,
  hasText,
  isValidEmail,
  isValidIsoDate,
  normalizeDateInput,
  normalizeEmail,
  normalizeText,
} from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
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
    private route: ActivatedRoute,
  ) {}

  private resolvePostAuthRedirect(): string {
    return this.route.snapshot.queryParamMap.get('redirectTo') || '/catalog';
  }

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
    this.error.set(null);
    this.loading.set(false);
  }

  onSubmit() {
    const email = normalizeEmail(this.email);
    this.email = email;

    if (!hasText(email) || !this.password.trim()) {
      this.error.set('Podaj email i hasło.');
      return;
    }

    if (!isValidEmail(email)) {
      this.error.set('Podaj poprawny adres email.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(email, this.password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.resolvePostAuthRedirect(), { replaceUrl: true });
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Nieprawidłowe dane logowania.');
        this.loading.set(false);
      },
    });
  }

  onRegister() {
    const first_name = normalizeText(this.registration.first_name);
    const last_name = normalizeText(this.registration.last_name);
    const email = normalizeEmail(this.registration.email);
    const birthdate = normalizeDateInput(this.registration.birthdate);
    const password = this.registration.password;
    const confirmPassword = this.registration.confirmPassword;

    this.registration = {
      ...this.registration,
      first_name,
      last_name,
      email,
      birthdate,
    };

    if (
      !hasText(first_name) ||
      !hasText(last_name) ||
      !hasText(email) ||
      !hasText(birthdate) ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      this.error.set('Uzupełnij wszystkie pola rejestracji.');
      return;
    }

    if (!isValidEmail(email)) {
      this.error.set('Podaj poprawny adres email.');
      return;
    }

    if (!isValidIsoDate(birthdate) || birthdate > getTodayIsoDate()) {
      this.error.set('Wybierz poprawną datę urodzenia.');
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
          this.router.navigateByUrl(this.resolvePostAuthRedirect(), { replaceUrl: true });
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
