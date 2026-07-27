import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { EmailComponent } from './email.component';
import { UsersService } from '@core/services/users.service';
import { PendingVerificationService } from '@core/services/pending-verification.service';

describe('EmailComponent', () => {
  let fixture: ComponentFixture<EmailComponent>;
  let component: EmailComponent;
  let usersMock: any;
  let pendingMock: any;
  let router: Router;

  beforeEach(async () => {
    usersMock = { sendVerificationCode: vi.fn() };
    pendingMock = { setLogin: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [EmailComponent],
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: usersMock },
        { provide: PendingVerificationService, useValue: pendingMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EmailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should mark all as touched when form invalid on submit', () => {
    component.form.patchValue({ login: '' });
    component.onSubmit();
    expect(component.form.controls.login.touched).toBe(true);
  });

  it('should set login and navigate on success', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    usersMock.sendVerificationCode.mockReturnValue(of({}));
    component.form.patchValue({ login: 'user@test.com' });

    component.onSubmit();

    expect(pendingMock.setLogin).toHaveBeenCalledWith('user@test.com');
    expect(navigateSpy).toHaveBeenCalledWith(['auth/email-verify']);
  });

  it('should map 400 field errors from ProblemDetail', () => {
    const problem = { detail: 'Invalid', errors: [{ field: 'login', message: 'E-mail inválido.' }] };
    usersMock.sendVerificationCode.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: problem })));
    component.form.controls.login.setValue('bad@test.com');

    component.onSubmit();

    expect(component.fieldErrors()['login']).toBe('E-mail inválido.');
  });

  it('should show conflict error on 409', () => {
    usersMock.sendVerificationCode.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.form.patchValue({ login: 'user@test.com' });

    component.onSubmit();

    expect(component.serverError()).toBe('Este email já está em uso.');
  });

  it('should show rate-limit error on 429', () => {
    usersMock.sendVerificationCode.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429 })));
    component.form.patchValue({ login: 'user@test.com' });

    component.onSubmit();

    expect(component.serverError()).toBe('Muitas tentativas. Aguarde 1 minuto.');
  });

  it('should show generic error on unknown status', () => {
    usersMock.sendVerificationCode.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.form.patchValue({ login: 'user@test.com' });

    component.onSubmit();

    expect(component.serverError()).toBe('Erro ao enviar código. Tente novamente.');
  });
});
