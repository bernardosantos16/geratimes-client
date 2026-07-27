import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('authInterceptor', () => {
  let authMock: { isAuthenticated: ReturnType<typeof vi.fn>; accessToken: ReturnType<typeof vi.fn>; isTokenExpired: ReturnType<typeof vi.fn>; refreshToken: ReturnType<typeof vi.fn>; logoutStarted: boolean; logout: ReturnType<typeof vi.fn>; isRefreshing: boolean; observeRefreshToken: ReturnType<typeof vi.fn>; startRefresh: ReturnType<typeof vi.fn>; completeRefresh: ReturnType<typeof vi.fn>; failRefresh: ReturnType<typeof vi.fn> };
  let nextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const fakeToken = { accessToken: 'token-abc', tokenType: 'Bearer', expiresInSeconds: 3600 };
    authMock = {
      isAuthenticated: vi.fn(() => true),
      accessToken: vi.fn(() => 'valid-token'),
      isTokenExpired: vi.fn(() => false),
      refreshToken: vi.fn(() => of(fakeToken)),
      logoutStarted: false,
      logout: vi.fn(() => of(void 0)),
      isRefreshing: false,
      observeRefreshToken: vi.fn(() => of('refreshed-token')),
      startRefresh: vi.fn(),
      completeRefresh: vi.fn(),
      failRefresh: vi.fn(),
    };
    nextMock = vi.fn((req: HttpRequest<unknown>) => of({ type: 0 }));

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });
  });

  function runInterceptor(req: HttpRequest<unknown>) {
    return TestBed.runInInjectionContext(() => authInterceptor(req, nextMock));
  }

  it('should pass public endpoints through without auth header', () => {
    const req = new HttpRequest('POST', 'http://localhost:8080/api/auth/login');
    runInterceptor(req).subscribe();
    expect(nextMock).toHaveBeenCalled();
    const forwardedReq = nextMock.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwardedReq.headers.has('Authorization')).toBe(false);
  });

  it('should add Authorization header for non-public requests when token exists', () => {
    const req = new HttpRequest('GET', 'http://localhost:8080/api/clubs');
    runInterceptor(req).subscribe();
    const forwardedReq = nextMock.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer valid-token');
  });

  it('should add withCredentials for API requests', () => {
    const req = new HttpRequest('GET', 'http://localhost:8080/api/clubs');
    runInterceptor(req).subscribe();
    const forwardedReq = nextMock.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwardedReq.withCredentials).toBe(true);
  });

  it('should not add withCredentials for non-API requests', () => {
    const req = new HttpRequest('GET', 'https://external-api.com/data');
    runInterceptor(req).subscribe();
    const forwardedReq = nextMock.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwardedReq.withCredentials).toBe(false);
  });

  it('should allow POST /api/users without auth header (user creation)', () => {
    const req = new HttpRequest('POST', 'http://localhost:8080/api/users');
    runInterceptor(req).subscribe();
    const forwardedReq = nextMock.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwardedReq.headers.has('Authorization')).toBe(false);
  });

  it('should refresh token proactively if token is expired', () => {
    authMock.accessToken.mockReturnValue('expired-token');
    authMock.isTokenExpired.mockReturnValue(true);
    authMock.refreshToken.mockReturnValue(of({ accessToken: 'new-token', tokenType: 'Bearer', expiresInSeconds: 3600 }));

    const req = new HttpRequest('GET', 'http://localhost:8080/api/clubs');
    runInterceptor(req).subscribe(() => {
      expect(authMock.completeRefresh).toHaveBeenCalledWith('new-token');
    });
  });

  it('should show toast on 403 error', () => {
    nextMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    const req = new HttpRequest('GET', 'http://localhost:8080/api/admin');
    runInterceptor(req).subscribe({
      error: () => {
        const toast = TestBed.inject(ToastService);
        expect(toast.error).toHaveBeenCalledWith('Acesso negado.');
      },
    });
  });

  it('should show toast on network error (status 0)', () => {
    nextMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const req = new HttpRequest('GET', 'http://localhost:8080/api/clubs');
    runInterceptor(req).subscribe({
      error: () => {
        const toast = TestBed.inject(ToastService);
        expect(toast.error).toHaveBeenCalledWith('Sem conexão com o servidor.');
      },
    });
  });

  it('should show toast on 500+ error', () => {
    nextMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const req = new HttpRequest('GET', 'http://localhost:8080/api/clubs');
    runInterceptor(req).subscribe({
      error: () => {
        const toast = TestBed.inject(ToastService);
        expect(toast.error).toHaveBeenCalledWith('Erro interno do servidor. Tente novamente.');
      },
    });
  });
});
