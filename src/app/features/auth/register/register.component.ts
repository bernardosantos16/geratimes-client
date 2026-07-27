import {ChangeDetectionStrategy, Component, inject, signal, DestroyRef, OnInit, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {UsersService} from '@core/services/users.service';
import {AuthService} from '@core/services/auth.service';
import {ToastService} from '@core/services/toast.service';
import {PendingVerificationService} from '@core/services/pending-verification.service';
import {HttpErrorResponse} from '@angular/common/http';
import {CreateUserRequestDTO, ProblemDetail} from '@core/models/api.models';
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";
import {matchPasswordValidator} from "@core/validators/match-password.validator";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, SvgIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'register.component.html',
    styleUrls: ['register.component.scss'],
})
export class RegisterComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly usersService = inject(UsersService);
    private readonly authService = inject(AuthService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly pendingVerification = inject(PendingVerificationService);
    private readonly destroyRef = inject(DestroyRef);

    readonly loading = signal(false);
    readonly showPassword = signal(false);
    readonly showConfirmPassword = signal(false);
    readonly serverError = signal('');
    readonly displayEmail = signal('');

    readonly form = this.fb.group(
        {
            name: ['', [Validators.required, Validators.maxLength(250)]],
            nickname: ['', [Validators.required, Validators.maxLength(100)]],
            password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
            confirmPassword: ['', Validators.required]
        },
        {
            validators: [matchPasswordValidator('password', 'confirmPassword')]
        }
    );

    get f() {
        return this.form.controls;
    }

    ngOnInit(): void {
        const email = this.pendingVerification.getLogin();
        if (!email) {
            this.router.navigate(['auth/email']).catch(() => {});
            return;
        }
        this.displayEmail.set(email);
    }

    backToVerify(): void {
        this.router.navigate(['auth/email-verify']).catch(() => {});
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const registrationToken = this.pendingVerification.getToken();
        if (!registrationToken) {
            this.router.navigate(['auth/email']).catch(() => {});
            return;
        }

        this.loading.set(true);
        this.serverError.set('');

        const rawValues = this.form.getRawValue();
        const { confirmPassword, ...userData } = rawValues;

        const dto: CreateUserRequestDTO = {
            name: userData.name!,
            nickname: userData.nickname!,
            password: userData.password!,
            registrationToken,
        };

        this.usersService.createUser(dto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.loading.set(false);
                this.pendingVerification.clear();
                this.toast.success('Conta criada com sucesso!');
                this.router.navigate(['auth/login']).catch(() => {});
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                if (err.status === 404) {
                    this.serverError.set('Sessão expirada. Recomece o cadastro.');
                } else if (err.status === 409) {
                    const body = err.error as ProblemDetail;
                    if (body?.errors?.length) {
                        this.serverError.set(body.errors.map(e => e.message).join(' '));
                    } else {
                        this.serverError.set('Apelido já cadastrado.');
                    }
                } else {
                    this.serverError.set('Erro ao criar conta. Tente novamente.');
                }
            },
        });
    }
}
