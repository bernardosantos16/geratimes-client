import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.accessToken();

  if (token && !auth.isTokenExpired(token)) {
    return true;
  }

  return auth.refreshToken().pipe(
    map(() => true),
    catchError(() =>
      auth.logout().pipe(
        map(() => router.createUrlTree(['/auth/login']))
      )
    )
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
