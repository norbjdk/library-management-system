import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, RegisterPayload, User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;
  private readonly isBrowser: boolean;
  private restorePromise: Promise<void> = Promise.resolve();
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly userKey = 'user';

  private _user = signal<User | null>(null);
  private _accessToken = signal<string | null>(null);
  private _ready = signal(false);

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isStaff = computed(() => this._user()?.is_staff ?? false);
  readonly role = computed(() => this._user()?.role ?? null);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreSession();
  }

  private setStoredValue(key: string, value: string | null): void {
    if (!this.isBrowser) {
      return;
    }

    if (value === null) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
  }

  private getStoredValue(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(key);
  }

  private isUnauthorizedStatus(status: number): boolean {
    return status === 401 || status === 403;
  }

  private shouldRedirectOnSessionFailure(): boolean {
    return this.router.url !== '/login' && this.router.url !== '/';
  }

  private finishRestore(resolve: () => void): void {
    this._ready.set(true);
    resolve();
  }

  private refreshProfile(resolve: () => void): void {
    this.http.get<User>(`${this.base}/auth/me/`, { withCredentials: true }).subscribe({
      next: (profile) => {
        this._user.set(profile);
        this.setStoredValue(this.userKey, JSON.stringify(profile));
        this.finishRestore(resolve);
      },
      error: (error: { status?: number }) => {
        if (this.isUnauthorizedStatus(error.status ?? 0)) {
          this.tryRefreshSession(resolve);
          return;
        }

        this.finishRestore(resolve);
      },
    });
  }

  private tryRefreshSession(resolve: () => void): void {
    this.refreshToken().subscribe({
      next: () => {
        this.refreshProfile(resolve);
      },
      error: (error: { status?: number }) => {
        if (this.isUnauthorizedStatus(error.status ?? 0)) {
          this.clearSession(this.shouldRedirectOnSessionFailure());
          resolve();
          return;
        }

        this.finishRestore(resolve);
      },
    });
  }

  private storeSession(response: AuthResponse): void {
    this._user.set(response.user);
    this._accessToken.set(response.access_token);
    this.setStoredValue(this.accessTokenKey, response.access_token);
    this.setStoredValue(this.refreshTokenKey, response.refresh_token);
    this.setStoredValue(this.userKey, JSON.stringify(response.user));
    this._ready.set(true);
  }

  private clearSession(navigate = false): void {
    this._user.set(null);
    this._accessToken.set(null);
    this.setStoredValue(this.accessTokenKey, null);
    this.setStoredValue(this.refreshTokenKey, null);
    this.setStoredValue(this.userKey, null);
    this._ready.set(true);

    if (navigate) {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  whenReady(): Promise<void> {
    return this.restorePromise;
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
    if (!this.isBrowser) {
      this.clearSession(true);
      return;
    }

    this.http.post(`${this.base}/auth/logout/`, {}, { withCredentials: true }).subscribe({
      next: () => this.clearSession(true),
      error: () => this.clearSession(true),
    });
  }

  updateCurrentUser(user: User): void {
    this._user.set(user);
    this.setStoredValue(this.userKey, JSON.stringify(user));
  }

  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refresh_token = this.getStoredValue(this.refreshTokenKey);
    const payload = refresh_token ? { refresh_token } : {};

    return this.http
      .post<{
        access_token: string;
        refresh_token: string;
      }>(`${this.base}/auth/refresh/`, payload, { withCredentials: true })
      .pipe(
        tap((response) => {
          this._accessToken.set(response.access_token);
          this.setStoredValue(this.accessTokenKey, response.access_token);
          this.setStoredValue(this.refreshTokenKey, response.refresh_token);
        }),
      );
  }

  private restoreSession(): void {
    if (!this.isBrowser) {
      this._ready.set(true);
      this.restorePromise = Promise.resolve();
      return;
    }

    this._ready.set(false);

    const token = this.getStoredValue(this.accessTokenKey);
    if (token) {
      this._accessToken.set(token);
    }

    const refreshToken = this.getStoredValue(this.refreshTokenKey);

    const user = this.getStoredValue(this.userKey);
    if (user) {
      try {
        this._user.set(JSON.parse(user));
      } catch {
        this.setStoredValue(this.userKey, null);
      }
    }

    this.restorePromise = new Promise((resolve) => {
      this.refreshProfile(resolve);
    });
  }
}
