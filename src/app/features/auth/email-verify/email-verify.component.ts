import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component, DestroyRef,
    ElementRef,
    inject,
    QueryList,
    signal,
    ViewChildren,
    computed,
    OnInit,
    OnDestroy,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ToastService} from '@core/services/toast.service';
import {HttpErrorResponse} from '@angular/common/http';
import {UsersService} from "@core/services/users.service";
import {PendingVerificationService} from "@core/services/pending-verification.service";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-email-verify',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './email-verify.component.html',
    styleUrls: ['./email-verify.component.scss'],
})
export class EmailVerifyComponent implements AfterViewInit, OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly userService = inject(UsersService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly pendingVerification = inject(PendingVerificationService);

    @ViewChildren('inputBox') inputBoxes!: QueryList<ElementRef<HTMLInputElement>>;

    readonly loading = signal(false);
    readonly serverError = signal('');
    readonly otpLength = new Array(6);

    readonly form = this.fb.group({
        token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    // --- Resend state ---
    private readonly TOKEN_VALIDITY_SECONDS = 300;

    readonly maskedEmail = signal('');
    readonly hasStoredEmail = signal(false);

    readonly emailForm = this.fb.group({
        login: ['', [Validators.required, Validators.email]],
    });

    readonly resendLoading = signal(false);
    readonly resendError = signal('');
    readonly countdown = signal(this.TOKEN_VALIDITY_SECONDS);
    readonly countdownDisplay = computed(() => {
        const seconds = this.countdown();
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    });
    readonly canResend = computed(() =>
        this.countdown() === 0 && !this.resendLoading()
    );

    private countdownInterval?: ReturnType<typeof setInterval>;

    ngOnInit(): void {
        const storedLogin = this.pendingVerification.getLogin();
        if (storedLogin) {
            this.hasStoredEmail.set(true);
            this.maskedEmail.set(this.pendingVerification.maskEmail(storedLogin));
        }
    }

    ngOnDestroy(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.inputBoxes.first?.nativeElement.focus(), 100);
        this.startCountdown();
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text').trim() || '';

        const numbersOnly = pastedData.replace(/\D/g, '').slice(0, 6);
        const inputsArray = this.inputBoxes.toArray();

        numbersOnly.split('').forEach((char, index) => {
            if (inputsArray[index]) {
                inputsArray[index].nativeElement.value = char;
            }
        });

        this.updateFormValue();

        const focusIndex = Math.min(numbersOnly.length, 5);
        inputsArray[focusIndex]?.nativeElement.focus();
    }

    onKeyDown(event: KeyboardEvent, index: number): void {
        const inputsArray = this.inputBoxes.toArray();
        const currentInput = inputsArray[index].nativeElement;

        if (event.key === 'Backspace' && currentInput.value === '' && index > 0) {
            const prevInput = inputsArray[index - 1].nativeElement;
            prevInput.value = '';
            prevInput.focus();
            this.updateFormValue();
            event.preventDefault();
        }
    }

    onKeyUp(event: KeyboardEvent, index: number): void {
        const inputsArray = this.inputBoxes.toArray();
        const currentInput = inputsArray[index].nativeElement;

        if (['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;

        if (event.key === 'ArrowLeft' && index > 0) {
            inputsArray[index - 1].nativeElement.focus();
            return;
        }

        if (event.key === 'ArrowRight' && index < 5) {
            inputsArray[index + 1].nativeElement.focus();
            return;
        }

        if (/^\d$/.test(currentInput.value) && index < 5) {
            inputsArray[index + 1].nativeElement.focus();
        }

        this.updateFormValue();
    }

    private updateFormValue(): void {
        const tokenValue = this.inputBoxes
            .toArray()
            .map(box => box.nativeElement.value)
            .join('');

        this.form.patchValue({token: tokenValue});
        this.form.controls.token.markAsTouched();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            return;
        }

        this.loading.set(true);
        this.serverError.set('');

        const tokenValue = this.form.getRawValue().token || '';

        this.userService.verifyEmail({ login: this.resolveLogin()!, token: tokenValue }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.pendingVerification.setToken(response.registrationToken);
                this.router.navigate(['auth/register']).catch(() => {});
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                if (err.status === 404) {
                    this.serverError.set('Código inválido ou expirado. Solicite um novo código de verificação.');
                } else if (err.status === 400) {
                    this.serverError.set('Código inválido. Verifique os 6 dígitos e tente novamente.');
                } else {
                    this.serverError.set('Ocorreu um erro ao verificar o email. Por favor, tente novamente mais tarde.');
                }
            },
        });
    }

    private startCountdown(): void {
        this.countdownInterval = setInterval(() => {
            const current = this.countdown();
            if (current <= 1) {
                clearInterval(this.countdownInterval);
                this.countdown.set(0);
            } else {
                this.countdown.set(current - 1);
            }
        }, 1000);
    }

    resendCode(): void {
        const login = this.resolveLogin();
        if (!this.canResend() || !login) {
            return;
        }

        this.resendLoading.set(true);
        this.resendError.set('');

        this.userService.sendVerificationCode(login).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.resendLoading.set(false);
                this.countdown.set(this.TOKEN_VALIDITY_SECONDS);
                this.startCountdown();
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

    useAnotherEmail(): void {
        this.pendingVerification.clear();
        this.hasStoredEmail.set(false);
        this.maskedEmail.set('');
        this.router.navigate(['auth/email']).catch(() => {});
    }

    private resolveLogin(): string | null {
        if (this.hasStoredEmail()) {
            return this.pendingVerification.getLogin();
        }
        if (this.emailForm.valid) {
            return this.emailForm.getRawValue().login || null;
        }
        return null;
    }
}
