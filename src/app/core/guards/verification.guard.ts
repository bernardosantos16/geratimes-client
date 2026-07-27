import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PendingVerificationService } from '../services/pending-verification.service';

export const verificationPendingGuard: CanActivateFn = () => {
  const pending = inject(PendingVerificationService);
  const router = inject(Router);

  if (pending.getLogin()) {
    return true;
  }

  return router.createUrlTree(['/auth/email']);
};

export const tokenRequiredGuard: CanActivateFn = () => {
  const pending = inject(PendingVerificationService);
  const router = inject(Router);

  if (pending.getLogin() && pending.getToken()) {
    return true;
  }

  if (pending.getLogin()) {
    return router.createUrlTree(['/auth/email-verify']);
  }

  return router.createUrlTree(['/auth/email']);
};
