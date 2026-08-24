import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '@core/services/users.service';
import { ForgotPasswordService } from '@core/services/forgot-password.service';
import { ToastService } from '@core/services/toast.service';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail, ResetPasswordRequestDTO } from '@core/models/api.models';
import { matchPasswordValidator } from '@core/validators/match-password.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly forgotPasswordService = inject(ForgotPasswordService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly resendLoading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly serverError = signal('');
  readonly resendError = signal('');
  readonly maskedEmail = signal('');

  readonly form = this.fb.group(
    {
      token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: [matchPasswordValidator('password', 'confirmPassword')],
    }
  );

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const email = this.forgotPasswordService.getEmail();
    if (!email) {
      this.router.navigate(['auth/forgot-password']).catch(() => {});
      return;
    }
    this.maskedEmail.set(this.forgotPasswordService.maskEmail(email));
  }

  onChangeEmail(): void {
    this.forgotPasswordService.clear();
    this.router.navigate(['auth/forgot-password']).catch(() => {});
  }

  onTokenInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = digits;
    this.form.controls.token.setValue(digits);
  }

  resendCode(): void {
    const email = this.forgotPasswordService.getEmail();
    if (!email || this.resendLoading()) {
      return;
    }

    this.resendLoading.set(true);
    this.resendError.set('');

    this.usersService.forgotPassword(email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.toast.success('Novo código enviado para seu email.');
      },
      error: (err: HttpErrorResponse) => {
        this.resendLoading.set(false);
        if (err.status === 429) {
          this.resendError.set('Muitas tentativas. Aguarde antes de solicitar outro código.');
        } else {
          this.resendError.set('Erro ao reenviar código. Tente novamente.');
        }
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.forgotPasswordService.getEmail();
    if (!email) {
      this.router.navigate(['auth/forgot-password']).catch(() => {});
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    const raw = this.form.getRawValue();
    const dto: ResetPasswordRequestDTO = {
      email,
      token: raw.token!,
      newPassword: raw.password!,
    };

    this.usersService.resetPassword(dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.forgotPasswordService.clear();
        this.toast.success('Senha redefinida com sucesso!');
        this.router.navigate(['auth/login']).catch(() => {});
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.serverError.set('Código inválido ou expirado. Solicite um novo código de recuperação.');
        } else if (err.status === 400) {
          const body = err.error as ProblemDetail;
          this.serverError.set(body?.detail || 'Dados inválidos. Verifique o código e a nova senha.');
        } else {
          this.serverError.set('Erro ao redefinir senha. Tente novamente.');
        }
      },
    });
  }
}
