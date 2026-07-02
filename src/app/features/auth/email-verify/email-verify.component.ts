import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component, DestroyRef,
    ElementRef,
    inject,
    QueryList,
    signal,
    ViewChildren
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ToastService} from '@core/services/toast.service';
import {HttpErrorResponse} from '@angular/common/http';
import {UsersService} from "@core/services/users.service";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-email-verify',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './email-verify.component.html',
    styleUrls: ['./email-verify.component.scss'],
})
export class EmailVerifyComponent implements AfterViewInit {
    private readonly fb = inject(FormBuilder);
    private readonly userService = inject(UsersService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    // Captura as referências dos 6 inputs do HTML
    @ViewChildren('inputBox') inputBoxes!: QueryList<ElementRef<HTMLInputElement>>;

    readonly loading = signal(false);
    readonly serverError = signal('');

    readonly otpLength = new Array(6); // Define o tamanho dos inputs (6 dígitos)

    readonly form = this.fb.group({
        token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    ngAfterViewInit(): void {
        // Foca no primeiro campo ao carregar a página
        setTimeout(() => this.inputBoxes.first?.nativeElement.focus(), 100);
    }

    /**
     * Captura o evento de colar texto (Paste)
     */
    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text').trim() || '';

        // Filtra para pegar apenas os primeiros 6 números passados
        const numbersOnly = pastedData.replace(/\D/g, '').slice(0, 6);
        const inputsArray = this.inputBoxes.toArray();

        // Distribui os números colados nos inputs correspondentes
        numbersOnly.split('').forEach((char, index) => {
            if (inputsArray[index]) {
                inputsArray[index].nativeElement.value = char;
            }
        });

        this.updateFormValue();

        // Joga o foco para o último preenchido ou mantém no último
        const focusIndex = Math.min(numbersOnly.length, 5);
        inputsArray[focusIndex]?.nativeElement.focus();
    }

    /**
     * Gerencia ações especiais de teclas antes do input mudar (Backspace)
     */
    onKeyDown(event: KeyboardEvent, index: number): void {
        const inputsArray = this.inputBoxes.toArray();
        const currentInput = inputsArray[index].nativeElement;

        if (event.key === 'Backspace' && currentInput.value === '' && index > 0) {
            // Se o campo atual já estiver vazio, volta para o anterior e apaga
            const prevInput = inputsArray[index - 1].nativeElement;
            prevInput.value = '';
            prevInput.focus();
            this.updateFormValue();
            event.preventDefault();
        }
    }

    /**
     * Gerencia navegação e fluxo após digitar (Setas e avanço automático)
     */
    onKeyUp(event: KeyboardEvent, index: number): void {
        const inputsArray = this.inputBoxes.toArray();
        const currentInput = inputsArray[index].nativeElement;

        // Ignora teclas de controle que não mudam o valor do caractere
        if (['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;

        if (event.key === 'ArrowLeft' && index > 0) {
            inputsArray[index - 1].nativeElement.focus();
            return;
        }

        if (event.key === 'ArrowRight' && index < 5) {
            inputsArray[index + 1].nativeElement.focus();
            return;
        }

        // Se digitou um número válido, avança o foco
        if (/^\d$/.test(currentInput.value) && index < 5) {
            inputsArray[index + 1].nativeElement.focus();
        }

        this.updateFormValue();
    }

    /**
     * Une o valor dos 6 inputs e atualiza o FormGroup principal
     */
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

        this.userService.verifyEmail(tokenValue).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.toast.success('Email verificado com sucesso!');
                this.router.navigate(['/login']);
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                if (err.status === 401) {
                    this.serverError.set('Código inválido ou expirado. Solicite um novo código de verificação.');
                } else {
                    this.serverError.set('Ocorreu um erro ao verificar o email. Por favor, tente novamente mais tarde.');
                }
            },
        });
    }
}