import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const staffGuard: CanActivateFn = async (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady();

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: state.url ? { redirectTo: state.url } : undefined,
    });
  }

  if (auth.isStaff()) {
    return true;
  }

  return router.createUrlTree(['/catalog']);
};
