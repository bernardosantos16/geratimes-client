import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ResetPasswordComponent } from './reset-password.component';
import { UsersService } from '@core/services/users.service';
import { ForgotPasswordService } from '@core/services/forgot-password.service';
import { ToastService } from '@core/services/toast.service';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let usersMock: any;
  let forgotPasswordMock: any;
  let toastMock: any;
  let router: Router;

  beforeEach(async () => {
    usersMock = { resetPassword: vi.fn(), forgotPassword: vi.fn() };
    toastMock = { success: vi.fn() };
    forgotPasswordMock = {
      getEmail: vi.fn().mockReturnValue('user@test.com'),
      maskEmail: vi.fn().mockReturnValue('us**@t***.com'),
      clear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: usersMock },
        { provide: ForgotPasswordService, useValue: forgotPasswordMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should redirect to forgot-password when no email stored', () => {
    forgotPasswordMock.getEmail.mockReturnValue(null);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.ngOnInit();

    expect(navSpy).toHaveBeenCalledWith(['auth/forgot-password']);
  });

  it('should set maskedEmail when email exists', () => {
    forgotPasswordMock.getEmail.mockReturnValue('user@test.com');
    component.ngOnInit();
    expect(component.maskedEmail()).toBe('us**@t***.com');
  });

  it('should mark all touched when form invalid on submit', () => {
    component.form.patchValue({ token: '', password: '', confirmPassword: '' });
    component.onSubmit();
    expect(component.form.controls.token.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
  });

  it('should reset password and navigate on success', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    usersMock.resetPassword.mockReturnValue(of({}));
    component.form.patchValue({
      token: '123456', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(usersMock.resetPassword).toHaveBeenCalledWith({
      email: 'user@test.com', token: '123456', newPassword: '12345678',
    });
    expect(forgotPasswordMock.clear).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith('Senha redefinida com sucesso!');
    expect(navSpy).toHaveBeenCalledWith(['auth/login']);
  });

  it('should show invalid token error on 404', () => {
    usersMock.resetPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.form.patchValue({
      token: '123456', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(component.serverError()).toBe('Código inválido ou expirado. Solicite um novo código de recuperação.');
  });

  it('should show invalid data error on 400', () => {
    usersMock.resetPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Senha muito curta.' } })));
    component.form.patchValue({
      token: '123456', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(component.serverError()).toBe('Senha muito curta.');
  });

  it('should show generic error on unknown status', () => {
    usersMock.resetPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.form.patchValue({
      token: '123456', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(component.serverError()).toBe('Erro ao redefinir senha. Tente novamente.');
  });

  it('should resend code and show toast on success', () => {
    usersMock.forgotPassword.mockReturnValue(of({}));

    component.resendCode();

    expect(usersMock.forgotPassword).toHaveBeenCalledWith('user@test.com');
    expect(toastMock.success).toHaveBeenCalledWith('Novo código enviado para seu email.');
  });

  it('should show rate-limit error on resend 429', () => {
    usersMock.forgotPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    component.resendCode();

    expect(component.resendError()).toBe('Muitas tentativas. Aguarde antes de solicitar outro código.');
  });
});
