import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthRequest = ['/auth/login/', '/auth/register/', '/auth/refresh/', '/auth/logout/'].some(
    (endpoint) => req.url.includes(endpoint),
  );
  const isUnauthorizedStatus = (status: number) => status === 401 || status === 403;

  const requestWithCredentials = req.clone({ withCredentials: true });

  if (isAuthRequest) {
    return next(requestWithCredentials);
  }

  const token = auth.accessToken();

  const authReq = token
    ? requestWithCredentials.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : requestWithCredentials;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return auth.refreshToken().pipe(
          switchMap((response) => {
            const retryReq = requestWithCredentials.clone({
              setHeaders: { Authorization: `Bearer ${response.access_token}` },
            });
            return next(retryReq);
          }),
          catchError((refreshError: HttpErrorResponse) => {
            if (isUnauthorizedStatus(refreshError.status)) {
              auth.logout();
            }
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
