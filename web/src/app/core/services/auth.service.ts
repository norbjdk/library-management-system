import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, RegisterPayload, User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  private _user = signal<User | null>(null);
  private _accessToken = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isStaff = computed(() => this._user()?.is_staff ?? false);
  readonly role = computed(() => this._user()?.role ?? null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.restoreSession();
  }

  private storeSession(response: AuthResponse): void {
    this._user.set(response.user);
    this._accessToken.set(response.access_token);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  private clearSession(navigate = false): void {
    this._user.set(null);
    this._accessToken.set(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/login/`, { email, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/register/`, payload)
      .pipe(tap((response) => this.storeSession(response)));
  }

  logout(): void {
    this.clearSession(true);
  }

  updateCurrentUser(user: User): void {
    this._user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refresh_token = localStorage.getItem('refresh_token') ?? '';
    if (!refresh_token) {
      return throwError(() => new Error('Missing refresh token.'));
    }

    return this.http
      .post<{
        access_token: string;
        refresh_token: string;
      }>(`${this.base}/auth/refresh/`, { refresh_token })
      .pipe(
        tap((response) => {
          this._accessToken.set(response.access_token);
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
        }),
      );
  }

  private restoreSession(): void {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }

    this._accessToken.set(token);

    const user = localStorage.getItem('user');
    if (user) {
      try {
        this._user.set(JSON.parse(user));
      } catch {
        localStorage.removeItem('user');
      }
    }

    this.http.get<User>(`${this.base}/auth/me/`).subscribe({
      next: (profile) => {
        this._user.set(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      },
      error: () => {
        this.clearSession(this.router.url !== '/login');
      },
    });
  }
}
