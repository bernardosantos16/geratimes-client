import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, ReplaySubject, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/users/verify-email',
];

function isPublic(req: HttpRequest<unknown>): boolean {
  return PUBLIC_ENDPOINTS.some((path) => req.url.includes(path)) || isCreateUserEndpoint(req);
}

function isCreateUserEndpoint(req: HttpRequest<unknown>): boolean {
  const apiUsersUrl = `${environment.apiUrl}/api/users`;
  return req.method === 'POST' && (req.url === apiUsersUrl || req.url.endsWith('/api/users'));
}

function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl) || url.includes('/api/');
}

function isRefreshRequest(url: string): boolean {
  return url.includes('/api/auth/refresh');
}

function addCredentials<T>(req: HttpRequest<T>): HttpRequest<T> {
  return isApiRequest(req.url) ? req.clone({ withCredentials: true }) : req;
}

function addAuthHeader<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function logoutAfterRefreshFailure(
    auth: AuthService,
    toast: ToastService,
    error: HttpErrorResponse
) {
  if (!auth.logoutStarted) {
    auth.logoutStarted = true;
    toast.error('Sessão expirada. Faça login novamente.');
    auth.logout().subscribe({ complete: () => { auth.logoutStarted = false; } });
  }
  return throwError(() => error);
}

function refreshAndRetry<T>(
    req: HttpRequest<T>,
    next: HttpHandlerFn,
    auth: AuthService,
    toast: ToastService,
    originalError: HttpErrorResponse
) {
  if (auth.isRefreshing) {
    return auth.refreshTokenSubject.pipe(
        take(1),
        switchMap((token) => next(addAuthHeader(req, token))),
        catchError((err: HttpErrorResponse) => logoutAfterRefreshFailure(auth, toast, err))
    );
  }

  auth.isRefreshing = true;
  auth.refreshTokenSubject = new ReplaySubject<string>(1);

  return auth.refreshToken().pipe(
      switchMap((tokenRes) => {
        auth.isRefreshing = false;
        auth.refreshTokenSubject.next(tokenRes.accessToken);
        auth.refreshTokenSubject.complete();
        return next(addAuthHeader(req, tokenRes.accessToken));
      }),
      catchError((err: HttpErrorResponse) => {
        auth.isRefreshing = false;
        auth.refreshTokenSubject.error(err);
        return logoutAfterRefreshFailure(auth, toast, err ?? originalError);
      })
  );
}

export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const credentialReq = addCredentials(req);

  if (isPublic(credentialReq) || isRefreshRequest(credentialReq.url)) {
    return next(credentialReq);
  }

  const token = auth.accessToken();

  if (token && auth.isTokenExpired(token)) {
    return refreshAndRetry(credentialReq, next, auth, toast, new HttpErrorResponse({ status: 401 }));
  }

  const authedReq = token ? addAuthHeader(credentialReq, token) : credentialReq;

  return next(authedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !auth.isRefreshing) {
          return refreshAndRetry(credentialReq, next, auth, toast, error);
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