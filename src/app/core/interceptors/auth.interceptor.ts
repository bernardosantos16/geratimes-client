import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

// Public endpoints that do NOT require a token
const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/users',           // POST — registration
  '/api/users/verify-email',
];

function isPublic(url: string): boolean {
  return PUBLIC_ENDPOINTS.some((path) => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const router = inject(Router);

  // Skip auth header for public routes
  if (isPublic(req.url)) {
    return next(req);
  }

  const token = auth.accessToken();
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Try to refresh the token once
        return auth.refresh().pipe(
          switchMap((tokenRes) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${tokenRes.accessToken}` },
            });
            return next(retryReq);
          }),
          catchError(() => {
            // Refresh failed — redirect to login
            router.navigate(['/auth/login']).then((success) => {
                if (!success) {
                    toast.error('Não foi possível redirecionar para a página de login. Por favor, tente novamente.');
                }
            });
            toast.error('Sessão expirada. Faça login novamente.');
            return throwError(() => error);
          })
        );
      }

      if (error.status === 403) {
        toast.error('Acesso negado.');
      } else if (error.status === 0) {
        toast.error('Sem conexão com o servidor.');
      } else if (error.status >= 500) {
        toast.error('Erro interno do servidor. Tente novamente.');
      }

      return throwError(() => error);
    })
  );
};
