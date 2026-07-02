import {ChangeDetectionStrategy, Component, inject, signal, DestroyRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {UsersService} from '@core/services/users.service';
import {AuthService} from '@core/services/auth.service';
import {ToastService} from '@core/services/toast.service';
import {HttpErrorResponse} from '@angular/common/http';
import {CreateUserRequestDTO} from '@core/models/api.models';
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
export class RegisterComponent {
    private readonly fb = inject(FormBuilder);
    private readonly usersService = inject(UsersService);
    private readonly authService = inject(AuthService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly loading = signal(false);
    readonly showPassword = signal(false);
    readonly showConfirmPassword = signal(false);
    readonly serverError = signal('');

    readonly form = this.fb.group(
        {
            name: ['', [Validators.required, Validators.maxLength(250)]],
            nickname: ['', [Validators.required, Validators.maxLength(100)]],
            login: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
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

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.serverError.set('');

        const rawValues = this.form.getRawValue();

        const { confirmPassword, ...userData } = rawValues;

        const dto = userData as CreateUserRequestDTO;

        this.usersService.createUser(dto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.toast.success('Conta criada! Bem-vindo ao Ferino.');
                this.router.navigate(['email-verify']);
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                if (err.status === 409) {
                    this.serverError.set('E-mail ou apelido já cadastrado.');
                } else {
                    this.serverError.set('Erro ao criar conta. Tente novamente.');
                }
            },
        });
    }
}
