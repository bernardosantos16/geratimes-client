import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { LoginRequestDTO } from '@core/models/api.models';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authMock: any;
  let toastMock: any;
  let router: Router;

  beforeEach(async () => {
    authMock = { login: vi.fn() };
    toastMock = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should mark all as touched when form is invalid on submit', () => {
    component.form.patchValue({ login: '', password: '' });
    component.onSubmit();
    expect(component.form.controls.login.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
  });

  it('should call login with form values and set loading', () => {
    const sub = of({ accessToken: 'token' });
    authMock.login.mockReturnValue(sub);
    component.form.patchValue({ login: 'user@test.com', password: 'pass123456' });
    component.serverError.set('previous error');

    component.onSubmit();

    expect(authMock.login).toHaveBeenCalledWith({
      login: 'user@test.com', password: 'pass123456',
    } as LoginRequestDTO);
    expect(component.serverError()).toBe('');
  });

  it('should show success toast and navigate on login success', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authMock.login.mockReturnValue(of({ accessToken: 'token' }));
    component.form.patchValue({ login: 'user@test.com', password: 'pass123456' });

    component.onSubmit();

    expect(toastMock.success).toHaveBeenCalledWith('Login realizado com sucesso!');
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on 401', () => {
    authMock.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    component.form.patchValue({ login: 'user@test.com', password: 'wrong' });

    component.onSubmit();

    expect(component.serverError()).toBe('E-mail ou senha incorretos.');
    expect(component.loading()).toBe(false);
  });

  it('should show generic error on other HTTP errors', () => {
    authMock.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.form.patchValue({ login: 'user@test.com', password: 'pass123456' });

    component.onSubmit();

    expect(component.serverError()).toBe('Erro ao fazer login. Tente novamente.');
    expect(component.loading()).toBe(false);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.showPassword.set(true);
    fixture.detectChanges();
    expect(component.showPassword()).toBe(true);
  });
});
