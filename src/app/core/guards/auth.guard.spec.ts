import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenResponseDTO } from '../models/api.models';
import { authGuard, guestGuard } from './auth.guard';

const token = (t = 'new-token'): TokenResponseDTO => ({ accessToken: t, tokenType: 'Bearer', expiresInSeconds: 3600 });

type GuardResult = boolean | UrlTree | Observable<boolean | UrlTree>;

describe('authGuard', () => {
  let authMock: any;
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authMock = {
      accessToken: vi.fn(() => 'valid-token'),
      isTokenExpired: vi.fn(() => false),
      refreshToken: vi.fn(() => of(token())),
      logout: vi.fn(() => of(void 0)),
      logoutStarted: false,
    };
    routerMock = { createUrlTree: vi.fn(() => ({} as UrlTree)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function runGuard(): GuardResult {
    return TestBed.runInInjectionContext(
      // CanActivateFn expects (route, state) — guard implementation takes 0
      () => (authGuard as () => GuardResult)(),
    );
  }

  it('should allow activation when a valid non-expired token exists', () => {
    authMock.accessToken.mockReturnValue('valid-token');
    authMock.isTokenExpired.mockReturnValue(false);
    expect(runGuard()).toBe(true);
  });

  it('should refresh the token when no token exists and allow if refresh succeeds', () => {
    authMock.accessToken.mockReturnValue(null);
    authMock.refreshToken.mockReturnValue(of(token()));

    (runGuard() as Observable<boolean | UrlTree>).subscribe((val) => {
      expect(val).toBe(true);
      expect(authMock.refreshToken).toHaveBeenCalled();
    });
  });

  it('should refresh token when expired and allow if refresh succeeds', () => {
    authMock.accessToken.mockReturnValue('expired-token');
    authMock.isTokenExpired.mockReturnValue(true);
    authMock.refreshToken.mockReturnValue(of(token()));

    (runGuard() as Observable<boolean | UrlTree>).subscribe((val) =>
      expect(val).toBe(true),
    );
  });

  it('should logout and redirect when refresh fails', () => {
    authMock.accessToken.mockReturnValue(null);
    authMock.refreshToken.mockReturnValue(throwError(() => new Error('refresh failed')));
    authMock.logout.mockReturnValue(of(void 0));

    (runGuard() as Observable<boolean | UrlTree>).subscribe(() => {
      expect(authMock.logout).toHaveBeenCalled();
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});

describe('guestGuard', () => {
  let authMock: any;
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authMock = { isAuthenticated: vi.fn(() => false) };
    routerMock = { createUrlTree: vi.fn(() => ({} as UrlTree)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function runGuestGuard(): GuardResult {
    return TestBed.runInInjectionContext(
      () => (guestGuard as () => GuardResult)(),
    );
  }

  it('should allow activation when the user is not authenticated', () => {
    authMock.isAuthenticated.mockReturnValue(false);
    expect(runGuestGuard()).toBe(true);
  });

  it('should redirect to /dashboard when authenticated', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    runGuestGuard();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
