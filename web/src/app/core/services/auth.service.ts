import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/user';

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

    constructor(private http: HttpClient, private router: Router) {
        this.restoreSession();
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http
            .post<AuthResponse>(`${this.base}/auth/login/`, { email, password })
            .pipe(
                tap(response => {
                    this._user.set(response.user);
                    this._accessToken.set(response.access_token);
                    localStorage.setItem('access_token', response.access_token);
                    localStorage.setItem('refresh_token', response.refresh_token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                })
            );
    }

    logout(): void {
        this._user.set(null);
        this._accessToken.set(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
    }

    refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
        const refresh_token = localStorage.getItem('refresh_token') ?? '';
        return this.http
            .post<{ access_token: string; refresh_token: string }>(
                `${this.base}/auth/refresh/`,
                { refresh_token }
            )
            .pipe(
                tap(response => {
                    this._accessToken.set(response.access_token);
                    localStorage.setItem('access_token', response.access_token);
                    localStorage.setItem('refresh_token', response.refresh_token);
                })
            );
    }

    // private restoreSession(): void {
    //     const token = localStorage.getItem('access_token');
    //     const user = localStorage.getItem('user');
    //     if (token && user) {
    //         this._accessToken.set(token);
    //         this._user.set(JSON.parse(user));
    //     }
    // }

    private restoreSession(): void {
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user');
        if (token && user) {
            this._accessToken.set(token);
            this._user.set(JSON.parse(user));
        }

        // TYMCZASOWO - usuń jak backend będzie działał
        if (!this._user()) {
            this._user.set({
                id: 1,
                email: 'admin@biblioteka.pl',
                first_name: 'Jan',
                last_name: 'Kowalski',
                role: 'admin',
                is_staff: true,
            });
        }
    }
}
