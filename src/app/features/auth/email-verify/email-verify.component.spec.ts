import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { EmailVerifyComponent } from './email-verify.component';
import { UsersService } from '@core/services/users.service';
import { PendingVerificationService } from '@core/services/pending-verification.service';
import { ToastService } from '@core/services/toast.service';

describe('EmailVerifyComponent', () => {
  let fixture: ComponentFixture<EmailVerifyComponent>;
  let component: EmailVerifyComponent;
  let usersMock: any;
  let pendingMock: any;
  let toastMock: any;
  let router: Router;

  beforeEach(async () => {
    usersMock = {
      verifyEmail: vi.fn(),
      sendVerificationCode: vi.fn(),
    };
    pendingMock = {
      getLogin: vi.fn().mockReturnValue('user@test.com'),
      getToken: vi.fn(),
      setToken: vi.fn(),
      maskEmail: vi.fn().mockReturnValue('us****@te***.com'),
      clear: vi.fn(),
    };
    toastMock = { success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [EmailVerifyComponent],
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: usersMock },
        { provide: PendingVerificationService, useValue: pendingMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EmailVerifyComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set maskedEmail from pendingVerification on init', () => {
    expect(component.maskedEmail()).toBe('us****@te***.com');
    expect(component.hasStoredEmail()).toBe(true);
  });

  it('should not have stored email when no login on first init', () => {
    // Fresh component with no stored login
    pendingMock.getLogin.mockReturnValue(null);
    const freshFixture = TestBed.createComponent(EmailVerifyComponent);
    const fresh = freshFixture.componentInstance;

    expect(fresh.hasStoredEmail()).toBe(false);
    expect(fresh.maskedEmail()).toBe('');
  });

  it('should verify email and navigate to register on success', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    usersMock.verifyEmail.mockReturnValue(of({ registrationToken: 'reg-token' }));
    component.form.controls.token.setValue('123456');

    component.onSubmit();

    expect(usersMock.verifyEmail).toHaveBeenCalledWith({ login: 'user@test.com', token: '123456' });
    expect(pendingMock.setToken).toHaveBeenCalledWith('reg-token');
    expect(navSpy).toHaveBeenCalledWith(['auth/register']);
  });

  it('should show error on 404 (invalid token)', () => {
    usersMock.verifyEmail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.form.controls.token.setValue('111111');

    component.onSubmit();

    expect(component.serverError()).toContain('inválido ou expirado');
    expect(component.loading()).toBe(false);
  });

  it('should show error on 400', () => {
    usersMock.verifyEmail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    component.form.controls.token.setValue('111111');

    component.onSubmit();

    expect(component.serverError()).toContain('inválido');
    expect(component.loading()).toBe(false);
  });

  it('should format countdown display correctly', () => {
    component.countdown.set(245);
    expect(component.countdownDisplay()).toBe('4:05');

    component.countdown.set(59);
    expect(component.countdownDisplay()).toBe('0:59');

    component.countdown.set(0);
    expect(component.countdownDisplay()).toBe('0:00');
  });

  it('should enable resend when countdown is 0', () => {
    component.countdown.set(300);
    component.resendLoading.set(false);
    expect(component.canResend()).toBe(false);

    component.countdown.set(0);
    expect(component.canResend()).toBe(true);
  });

  it('should use another email and clear pending verification', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.useAnotherEmail();

    expect(pendingMock.clear).toHaveBeenCalled();
    expect(component.hasStoredEmail()).toBe(false);
    expect(navSpy).toHaveBeenCalledWith(['auth/email']);
  });

  it('should clean up interval on destroy', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval');
    component['startCountdown']();

    component.ngOnDestroy();

    expect(clearSpy).toHaveBeenCalled();
  });
});
