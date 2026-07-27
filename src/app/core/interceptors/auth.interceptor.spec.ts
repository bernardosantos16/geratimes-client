import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

function req(method: string, url: string): HttpRequest<unknown> {
  // HttpRequest has narrow literal overloads for method — `as any` avoids
  // TS2769 on 'POST' | 'PATCH' etc. in tests.
  return new HttpRequest<unknown>(method as any, url);
}

describe('authInterceptor', () => {
  let authMock: any;
  let nextFn: HttpHandlerFn;

  beforeEach(() => {
    authMock = {
      isAuthenticated: vi.fn(() => true),
      accessToken: vi.fn(() => 'valid-token'),
      isTokenExpired: vi.fn(() => false),
      refreshToken: vi.fn(() => of({ accessToken: 'token-abc', tokenType: 'Bearer', expiresInSeconds: 3600 })),
      logoutStarted: false,
      logout: vi.fn(() => of(void 0)),
      isRefreshing: false,
      observeRefreshToken: vi.fn(() => of('refreshed-token')),
      startRefresh: vi.fn(),
      completeRefresh: vi.fn(),
      failRefresh: vi.fn(),
    };
    nextFn = vi.fn(() => of({ type: 0 })) as unknown as HttpHandlerFn;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });
  });

  function intercept(r: HttpRequest<unknown>) {
    return TestBed.runInInjectionContext(() => authInterceptor(r, nextFn));
  }

  it('should pass public endpoints through without auth header', () => {
    intercept(req('POST', 'http://localhost:8080/api/auth/login')).subscribe();
    const fwd = (nextFn as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(fwd.headers.has('Authorization')).toBe(false);
  });

  it('should add Authorization header for non-public requests when token exists', () => {
    intercept(req('GET', 'http://localhost:8080/api/clubs')).subscribe();
    const fwd = (nextFn as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(fwd.headers.get('Authorization')).toBe('Bearer valid-token');
  });

  it('should add withCredentials for API requests', () => {
    intercept(req('GET', 'http://localhost:8080/api/clubs')).subscribe();
    const fwd = (nextFn as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(fwd.withCredentials).toBe(true);
  });

  it('should not add withCredentials for non-API requests', () => {
    intercept(req('GET', 'https://external-api.com/data')).subscribe();
    const fwd = (nextFn as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(fwd.withCredentials).toBe(false);
  });

  it('should allow POST /api/users without auth header (user creation)', () => {
    intercept(req('POST', 'http://localhost:8080/api/users')).subscribe();
    const fwd = (nextFn as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(fwd.headers.has('Authorization')).toBe(false);
  });

  it('should refresh token proactively if token is expired', () => {
    authMock.accessToken.mockReturnValue('expired-token');
    authMock.isTokenExpired.mockReturnValue(true);
    authMock.refreshToken.mockReturnValue(of({ accessToken: 'new-token', tokenType: 'Bearer', expiresInSeconds: 3600 }));

    intercept(req('GET', 'http://localhost:8080/api/clubs')).subscribe(() => {
      expect(authMock.completeRefresh).toHaveBeenCalledWith('new-token');
    });
  });

  it('should show toast on 403 error', () => {
    (nextFn as any).mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    intercept(req('GET', 'http://localhost:8080/api/admin')).subscribe({
      error: () => {
        expect(TestBed.inject(ToastService).error).toHaveBeenCalledWith('Acesso negado.');
      },
    });
  });

  it('should show toast on network error (status 0)', () => {
    (nextFn as any).mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    intercept(req('GET', 'http://localhost:8080/api/clubs')).subscribe({
      error: () => {
        expect(TestBed.inject(ToastService).error).toHaveBeenCalledWith('Sem conexão com o servidor.');
      },
    });
  });

  it('should show toast on 500+ error', () => {
    (nextFn as any).mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    intercept(req('GET', 'http://localhost:8080/api/clubs')).subscribe({
      error: () => {
        expect(TestBed.inject(ToastService).error).toHaveBeenCalledWith('Erro interno do servidor. Tente novamente.');
      },
    });
  });
});
