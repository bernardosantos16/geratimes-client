import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('authGuard', () => {
  let authMock: { accessToken: ReturnType<typeof vi.fn>; isTokenExpired: ReturnType<typeof vi.fn>; refreshToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn>; logoutStarted: boolean };
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authMock = {
      accessToken: vi.fn(() => 'valid-token'),
      isTokenExpired: vi.fn(() => false),
      refreshToken: vi.fn(() => of({ accessToken: 'new-token', tokenType: 'Bearer', expiresInSeconds: 3600 })),
      logout: vi.fn(() => of(void 0)),
      logoutStarted: false,
    };
    routerMock = { createUrlTree: vi.fn((path: string[]) => ({ urlTree: true, path })) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() => authGuard());
  }

  it('should allow activation when a valid non-expired token exists', () => {
    authMock.accessToken.mockReturnValue('valid-token');
    authMock.isTokenExpired.mockReturnValue(false);

    const result = runGuard();
    expect(result).toBe(true);
  });

  it('should refresh the token when no token exists and allow if refresh succeeds', () => {
    authMock.accessToken.mockReturnValue(null);
    authMock.refreshToken.mockReturnValue(of({ accessToken: 'new-token', tokenType: 'Bearer', expiresInSeconds: 3600 }));

    const result = runGuard();
    (result as any).subscribe((val: unknown) => {
      expect(val).toBe(true);
      expect(authMock.refreshToken).toHaveBeenCalled();
    });
  });

  it('should refresh the token when the current token is expired and allow if refresh succeeds', () => {
    authMock.accessToken.mockReturnValue('expired-token');
    authMock.isTokenExpired.mockReturnValue(true);
    authMock.refreshToken.mockReturnValue(of({ accessToken: 'new-token', tokenType: 'Bearer', expiresInSeconds: 3600 }));

    const result = runGuard();
    (result as any).subscribe((val: unknown) => {
      expect(val).toBe(true);
    });
  });

  it('should logout and redirect to /auth/login when refresh fails', () => {
    authMock.accessToken.mockReturnValue(null);
    authMock.refreshToken.mockReturnValue(throwError(() => new Error('refresh failed')));
    authMock.logout.mockReturnValue(of(void 0));

    const result = runGuard();
    (result as any).subscribe((val: unknown) => {
      expect(authMock.logout).toHaveBeenCalled();
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});

describe('guestGuard', () => {
  let authMock: { isAuthenticated: ReturnType<typeof vi.fn> };
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authMock = { isAuthenticated: vi.fn(() => false) };
    routerMock = { createUrlTree: vi.fn(() => ({ urlTree: true })) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function runGuestGuard() {
    return TestBed.runInInjectionContext(() => guestGuard());
  }

  it('should allow activation when the user is not authenticated', () => {
    authMock.isAuthenticated.mockReturnValue(false);
    const result = runGuestGuard();
    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when the user is authenticated', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    const result = runGuestGuard();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
