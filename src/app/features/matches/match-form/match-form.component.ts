import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchesService } from '@core/services/matches.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

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

  private clubId!: string;

  readonly form = this.fb.group({
    dateTime: ['', Validators.required],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.clubId = this.route.snapshot.paramMap.get('id')!;
    console.log('Club ID:', this.clubId);
    this.backLink.set('/clubs/' + this.clubId);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');

    const { dateTime } = this.form.getRawValue();
    const dto = {
      clubId: this.clubId,
      dateTime: new Date(dateTime!).toISOString(),
    };

    this.matchesService.createMatch(dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (match) => {
        this.toast.success('Partida agendada!');
        this.router.navigate(['/matches', match.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err.error?.detail ?? 'Erro ao agendar partida.');
      },
    });
  }
}
