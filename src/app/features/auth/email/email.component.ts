import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '@core/services/users.service';
import { PendingVerificationService } from '@core/services/pending-verification.service';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '@core/models/api.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
})
export class EmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);
  private readonly pendingVerification = inject(PendingVerificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly form = this.fb.group({
    login: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
  });

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');
    this.fieldErrors.set({});

    const login = this.form.getRawValue().login!;

    this.usersService.sendVerificationCode(login).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.pendingVerification.setLogin(login);
        this.router.navigate(['auth/email-verify']).catch(() => {});
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);

        if (err.status === 400) {
          const body = err.error as ProblemDetail;
          if (body?.errors?.length) {
            const mapped: Record<string, string> = {};
            for (const e of body.errors) {
              mapped[e.field] = e.message;
            }
            this.fieldErrors.set(mapped);
          } else {
            this.serverError.set(body?.detail || 'Dados inválidos.');
          }
        } else if (err.status === 409) {
          this.serverError.set('Este email já está em uso.');
        } else if (err.status === 429) {
          this.serverError.set('Muitas tentativas. Aguarde 1 minuto.');
        } else {
          this.serverError.set('Erro ao enviar código. Tente novamente.');
        }
      },
    });
  }
}
