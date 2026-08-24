import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ForgotPasswordComponent } from './forgot-password.component';
import { UsersService } from '@core/services/users.service';
import { ForgotPasswordService } from '@core/services/forgot-password.service';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let usersMock: any;
  let forgotPasswordMock: any;
  let router: Router;

  beforeEach(async () => {
    usersMock = { forgotPassword: vi.fn() };
    forgotPasswordMock = { setEmail: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: usersMock },
        { provide: ForgotPasswordService, useValue: forgotPasswordMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should mark all as touched when form invalid on submit', () => {
    component.form.patchValue({ login: '' });
    component.onSubmit();
    expect(component.form.controls.login.touched).toBe(true);
  });

  it('should set email and navigate on success', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    usersMock.forgotPassword.mockReturnValue(of({}));
    component.form.patchValue({ login: 'user@test.com' });

    component.onSubmit();

    expect(forgotPasswordMock.setEmail).toHaveBeenCalledWith('user@test.com');
    expect(navigateSpy).toHaveBeenCalledWith(['auth/reset-password']);
  });

  it('should map 400 field errors from ProblemDetail', () => {
    const problem = { detail: 'Invalid', errors: [{ field: 'login', message: 'E-mail inválido.' }] };
    usersMock.forgotPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: problem })));
    component.form.controls.login.setValue('bad@test.com');

    component.onSubmit();

    expect(component.fieldErrors()['login']).toBe('E-mail inválido.');
  });

  it('should show rate-limit error on 429', () => {
    usersMock.forgotPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429 })));
    component.form.patchValue({ login: 'user@test.com' });

    component.onSubmit();

    expect(component.serverError()).toBe('Muitas tentativas. Aguarde antes de solicitar novamente.');
  });

  it('should show generic error on unknown status', () => {
    usersMock.forgotPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.form.patchValue({ login: 'user@test.com' });

    component.onSubmit();

    expect(component.serverError()).toBe('Erro ao solicitar recuperação. Tente novamente.');
  });
});
