import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady();

  if (!auth.isLoggedIn()) {
    return true;
  }

  const redirectTo = state.root.queryParams['redirectTo'];
  return router.parseUrl(redirectTo || '/catalog');
};
