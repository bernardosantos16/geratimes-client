import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators,
  AbstractControl, AsyncValidatorFn, ValidationErrors
} from '@angular/forms';
import { forkJoin, debounceTime, distinctUntilChanged, first, map, of, switchMap, catchError, Observable } from 'rxjs';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StepIndicatorComponent } from '@shared/components/step-indicator/step-indicator.component';
import { AddJerseyRequestDTO, CreateClubRequestDTO, UpdateClubRequestDTO } from '@core/models/api.models';

const NICKNAME_PATTERN = /^[a-z0-9_-]{3,24}$/;

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, StepIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:  'club-form.component.html',
  styleUrls: ['club-form.component.scss'],
})
export class ClubFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly isEdit = signal(false);
  readonly serverError = signal('');

  readonly step = signal(1);

  readonly clubSteps = [
    { key: 'club', label: 'Clube' },
    { key: 'jerseys', label: 'Uniformes' },
  ];

  get currentStepKey(): string {
    return this.step() === 1 ? 'club' : 'jerseys';
  }

  private editId: string | null = null;

  readonly form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(1)]],
    nickname: ['', [Validators.required, Validators.pattern(NICKNAME_PATTERN)]],
    joinPolicy: ['INVITE_ONLY' as 'OPEN' | 'INVITE_ONLY'],
  });

  readonly jerseyForms = signal<FormGroup[]>([]);

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    const nicknameControl = this.form.controls.nickname;
    if (this.editId) {
      this.isEdit.set(true);
      // No edit o apelido é opcional (mantém o atual se não preenchido).
      nicknameControl.setValidators([Validators.pattern(NICKNAME_PATTERN)]);
      nicknameControl.updateValueAndValidity();
      this.clubsService.getClubById(this.editId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (club) => this.form.patchValue(club),
        error: (err: unknown) => { this.toast.error('Clube não encontrado.'); this.router.navigate(['/clubs']).catch(() => {}); },
      });
    } else {
      // No create o apelido é obrigatório e validado quanto à disponibilidade.
      nicknameControl.setValidators([Validators.required, Validators.pattern(NICKNAME_PATTERN)]);
      nicknameControl.setAsyncValidators(this.nicknameAvailabilityValidator());
      nicknameControl.updateValueAndValidity();
      this.addJerseyRow({ name: 'Time 1', hexColor: '#4dff8f' });
      this.addJerseyRow({ name: 'Time 2', hexColor: '#4d9fff' });
      this.addJerseyRow({ name: 'Goleiros', hexColor: '#ff4d6a', isGoalkeeper: true });
    }
  }

  private nicknameAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!String(control.value ?? '').trim()) {
        return of(null);
      }
      return control.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: unknown) =>
          this.clubsService.checkNicknameAvailable(String(value ?? '').trim()).pipe(
            map((available) => (available ? null : { nicknameTaken: true })),
            catchError(() => of(null)),
          )
        ),
        first(),
      );
    };
  }

  goToJerseys(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.step.set(2);
  }

  backToClub(): void {
    this.step.set(1);
  }

  addJerseyRow(options?: { name?: string; hexColor?: string; isGoalkeeper?: boolean }): void {
    const id = crypto.randomUUID();
    const group = this.fb.group({
      id: [id],
      name: [options?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      hexColor: [options?.hexColor ?? '#4dff8f', [Validators.required, Validators.pattern(/^#?[0-9a-fA-F]{6}$/)]],
      isGoalkeeperJersey: [options?.isGoalkeeper ?? false],
    });
    this.jerseyForms.update((arr) => [...arr, group]);
  }

  removeJerseyRow(id: string): void {
    this.jerseyForms.update((arr) => arr.filter((g) => g.get('id')?.value !== id));
  }

  get lineCount(): number {
    return this.jerseyForms().filter((g) => !g.get('isGoalkeeperJersey')?.value).length;
  }

  get gkCount(): number {
    return this.jerseyForms().filter((g) => g.get('isGoalkeeperJersey')?.value).length;
  }

  private validateJerseys(): boolean {
    if (this.lineCount < 2) {
      this.toast.error('Adicione pelo menos 2 camisas de linha.');
      return false;
    }
    if (this.gkCount < 1) {
      this.toast.error('Adicione pelo menos 1 camisa de goleiro.');
      return false;
    }
    for (const group of this.jerseyForms()) {
      if (group.invalid) {
        group.markAllAsTouched();
        this.toast.error('Preencha todos os campos das camisas.');
        return false;
      }
    }
    return true;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (!this.isEdit() && !this.validateJerseys()) return;

    this.loading.set(true);
    this.serverError.set('');

    const raw = this.form.getRawValue();
    const obs = this.isEdit()
      ? this.clubsService.updateClub(this.editId!, raw as UpdateClubRequestDTO)
      : this.clubsService.createClub(raw as CreateClubRequestDTO);

    obs.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (club) => {
        if (!this.isEdit()) {
          this.loading.set(false);
          this.createJerseys(club.id);
        } else {
          this.loading.set(false);
          this.toast.success('Clube atualizado!');
          this.router.navigate(['/clubs', club.id]).catch(() => {});
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err.error?.detail ?? 'Erro ao salvar clube.');
      },
    });
  }

  private createJerseys(clubId: string): void {
    const jerseyDtos = this.jerseyForms().map((g) => ({
      name: g.get('name')?.value,
      hexColor: g.get('hexColor')?.value,
      isGoalkeeperJersey: g.get('isGoalkeeperJersey')?.value,
    })) as AddJerseyRequestDTO[];
    forkJoin(jerseyDtos.map((dto) => this.clubsService.addJersey(clubId, dto)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Clube e camisas criados!');
          this.router.navigate(['/clubs', clubId]).catch(() => {});
        },
        error: (err: unknown) => {
          this.toast.warning('Clube criado, mas houve erro ao criar algumas camisas.');
          this.router.navigate(['/clubs', clubId]).catch(() => {});
        },
      });
  }
}
