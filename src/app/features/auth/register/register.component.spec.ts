import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterComponent } from './register.component';
import { UsersService } from '@core/services/users.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { PendingVerificationService } from '@core/services/pending-verification.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let usersMock: any;
  let toastMock: any;
  let pendingMock: any;
  let router: Router;

  beforeEach(async () => {
    usersMock = { createUser: vi.fn() };
    toastMock = { success: vi.fn() };
    pendingMock = {
      getLogin: vi.fn().mockReturnValue('user@test.com'),
      getToken: vi.fn().mockReturnValue('reg-token-123'),
      clear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: usersMock },
        { provide: ToastService, useValue: toastMock },
        { provide: PendingVerificationService, useValue: pendingMock },
        { provide: AuthService, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should redirect to /auth/email when no login stored', () => {
    pendingMock.getLogin.mockReturnValue(null);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.ngOnInit();

    expect(navSpy).toHaveBeenCalledWith(['auth/email']);
  });

  it('should set displayEmail when login exists', () => {
    pendingMock.getLogin.mockReturnValue('user@test.com');
    component.ngOnInit();
    expect(component.displayEmail()).toBe('user@test.com');
  });

  it('should mark all touched when form invalid on submit', () => {
    component.form.patchValue({ name: '', nickname: '', password: '', confirmPassword: '' });
    component.onSubmit();
    expect(component.form.controls.name.touched).toBe(true);
    expect(component.form.controls.nickname.touched).toBe(true);
  });

  it('should redirect to /auth/email when registration token is missing', () => {
    pendingMock.getToken.mockReturnValue(null);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.patchValue({
      name: 'João', nickname: 'joao', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(navSpy).toHaveBeenCalledWith(['auth/email']);
  });

  it('should create user and navigate on success', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    usersMock.createUser.mockReturnValue(of({}));
    component.form.patchValue({
      name: 'João', nickname: 'joao', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(usersMock.createUser).toHaveBeenCalled();
    expect(pendingMock.clear).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith('Conta criada com sucesso!');
    expect(navSpy).toHaveBeenCalledWith(['auth/login']);
  });

  it('should show session expired error on 404', () => {
    usersMock.createUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.form.patchValue({
      name: 'João', nickname: 'joao', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(component.serverError()).toBe('Sessão expirada. Recomece o cadastro.');
  });

  it('should show nickname error on 409 with errors', () => {
    usersMock.createUser.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { errors: [{ field: 'nickname', message: 'Apelido já cadastrado.' }] },
    })));
    component.form.patchValue({
      name: 'João', nickname: 'joao', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(component.serverError()).toBe('Apelido já cadastrado.');
  });

  it('should show generic error on unknown status', () => {
    usersMock.createUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.form.patchValue({
      name: 'João', nickname: 'joao', password: '12345678', confirmPassword: '12345678',
    });

    component.onSubmit();

    expect(component.serverError()).toBe('Erro ao criar conta. Tente novamente.');
  });
});
