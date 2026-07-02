import { Component, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import { JerseyBadgeComponent } from '@shared/components/jersey-badge/jersey-badge.component';

@Component({
    selector: 'app-club-jerseys',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, JerseyBadgeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'club-jerseys.component.html',
    styleUrls: ['../../../shared/components/club-detail-nav/club-detail-nav.component.scss', './club-jerseys.component.scss'],
})
export class ClubJerseysComponent {
    private readonly clubsService = inject(ClubsService);
    private readonly toast = inject(ToastService);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    readonly store = inject(ClubDetailStore);

    readonly jerseyForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        hexColor: ['#4dff8f', [Validators.required, Validators.pattern(/^#?[0-9a-fA-F]{6}$/)]],
        isGoalkeeperJersey: [false],
    });

    constructor() {
        this.loadJerseys();
    }

    private loadJerseys(): void {
        this.clubsService.getJerseys(this.store.clubId())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (jerseys) => this.store.jerseys.set(jerseys),
                error: () => this.toast.error('Erro ao carregar camisas.'),
            });
    }

    addJersey(): void {
        if (this.jerseyForm.invalid) return;
        this.clubsService.addJersey(this.store.clubId(), this.jerseyForm.getRawValue() as any)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (j) => {
                    this.store.jerseys.update((arr) => [...arr, j]);
                    this.jerseyForm.reset({ name: '', hexColor: '#4dff8f', isGoalkeeperJersey: false });
                    this.toast.success('Camisa adicionada!');
                },
                error: () => this.toast.error('Erro ao adicionar camisa.'),
            });
    }

    deleteJersey(id: number): void {
        this.clubsService.deleteJersey(this.store.clubId(), id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.store.jerseys.update((arr) => arr.filter((j) => j.id !== id));
                    this.toast.success('Camisa removida.');
                },
                error: () => this.toast.error('Erro ao remover camisa.'),
            });
    }
}
