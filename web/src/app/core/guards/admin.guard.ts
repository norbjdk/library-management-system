import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady();

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: state.url ? { redirectTo: state.url } : undefined,
    });
  }

  if (auth.isAdmin()) {
    return true;
  }

  if (auth.isStaff()) {
    return router.createUrlTree(['/admin']);
  }

  return router.createUrlTree(['/catalog']);
};
