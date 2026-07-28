import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { PendingVerificationService } from '../services/pending-verification.service';
import { verificationPendingGuard, tokenRequiredGuard } from './verification.guard';

describe('verificationPendingGuard', () => {
  let pendingMock: any;
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    pendingMock = { getLogin: vi.fn() };
    routerMock = { createUrlTree: vi.fn(() => ({} as UrlTree)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: PendingVerificationService, useValue: pendingMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(
      () => (verificationPendingGuard as () => ReturnType<typeof verificationPendingGuard>)(),
    );
  }

  it('should allow activation when login is set', () => {
    pendingMock.getLogin.mockReturnValue('user@email.com');
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /auth/email when login is not set', () => {
    pendingMock.getLogin.mockReturnValue(null);
    runGuard();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/email']);
  });
});

describe('tokenRequiredGuard', () => {
  let pendingMock: any;
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    pendingMock = { getLogin: vi.fn(), getToken: vi.fn() };
    routerMock = { createUrlTree: vi.fn(() => ({} as UrlTree)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: PendingVerificationService, useValue: pendingMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(
      () => (tokenRequiredGuard as () => ReturnType<typeof tokenRequiredGuard>)(),
    );
  }

  it('should allow activation when login and token are set', () => {
    pendingMock.getLogin.mockReturnValue('user@email.com');
    pendingMock.getToken.mockReturnValue('verification-token');
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /auth/email-verify when login is set but token is missing', () => {
    pendingMock.getLogin.mockReturnValue('user@email.com');
    pendingMock.getToken.mockReturnValue(null);
    runGuard();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/email-verify']);
  });

  it('should redirect to /auth/email when neither login nor token are set', () => {
    pendingMock.getLogin.mockReturnValue(null);
    pendingMock.getToken.mockReturnValue(null);
    runGuard();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/email']);
  });
});
