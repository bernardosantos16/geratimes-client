import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchesService } from '@core/services/matches.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Segunda-feira' },
  { value: 'TUESDAY', label: 'Terça-feira' },
  { value: 'WEDNESDAY', label: 'Quarta-feira' },
  { value: 'THURSDAY', label: 'Quinta-feira' },
  { value: 'FRIDAY', label: 'Sexta-feira' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
] as const;

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'match-form.component.html',
  styleUrls: ['match-form.component.scss'],
})
export class MatchFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly matchesService = inject(MatchesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly backLink = signal<string>('');
  readonly mode = signal<'single' | 'batch'>('single');
  readonly daysOfWeek = DAYS_OF_WEEK;

  private clubId!: string;

  readonly form = this.fb.nonNullable.group({
    dateTime: [''],
    dayOfWeek: [''],
    time: [''],
    startDate: [''],
    endDate: [''],
    zoneId: ['America/Sao_Paulo'],
  });

  ngOnInit(): void {
    this.clubId = this.route.snapshot.paramMap.get('id')!;
    this.backLink.set('/clubs/' + this.clubId);
  }

  onSubmit(): void {
    this.serverError.set('');

    if (this.mode() === 'single') {
      this.submitSingle();
    } else {
      this.submitBatch();
    }
  }

  private submitSingle(): void {
    const { dateTime } = this.form.getRawValue();
    if (!dateTime) {
      this.form.controls.dateTime.markAsTouched();
      return;
    }

    this.loading.set(true);
    const dto = {
      clubId: this.clubId,
      dateTime: new Date(dateTime).toISOString(),
    };

    this.matchesService.createMatch(dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (match) => {
        this.loading.set(false);
        this.toast.success('Partida agendada!');
        this.router.navigate(['/matches', match.id]).catch(() => {});
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err.error?.detail ?? 'Erro ao agendar partida.');
      },
    });
  }

  private submitBatch(): void {
    const { dayOfWeek, time, startDate, endDate, zoneId } = this.form.getRawValue();
    if (!dayOfWeek || !time || !startDate || !endDate) {
      if (!dayOfWeek) this.form.controls.dayOfWeek.markAsTouched();
      if (!time) this.form.controls.time.markAsTouched();
      if (!startDate) this.form.controls.startDate.markAsTouched();
      if (!endDate) this.form.controls.endDate.markAsTouched();
      return;
    }

    this.loading.set(true);
    const dto = { clubId: this.clubId, dayOfWeek, time, startDate, endDate, zoneId };

    this.matchesService.createBatchMatches(dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (matches) => {
        this.loading.set(false);
        this.toast.success(`${matches.length} partidas agendadas!`);
        this.router.navigate(['/clubs', this.clubId, 'matches']).catch(() => {});
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err.error?.detail ?? 'Erro ao agendar partidas.');
      },
    });
  }
}
