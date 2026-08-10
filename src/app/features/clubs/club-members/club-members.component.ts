import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import { ClubMemberResponseDTO, AddClubMemberRequestDTO, UpdateClubMemberRequestDTO } from '@core/models/api.models';
import { SquareRatingComponent } from '@shared/components/square-rating/square-rating.component';
import { ClubRolePipe } from '@shared/pipes/app.pipes';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { MemberCardComponent } from '@shared/components/member-card/member-card.component';
import { EditMemberModalComponent, SaveMemberEvent } from '../edit-member-modal/edit-member-modal.component';

@Component({
    selector: 'app-club-members',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        SquareRatingComponent, ClubRolePipe, ConfirmDialogComponent,
        MemberCardComponent, EditMemberModalComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'club-members.component.html',
    styleUrls: ['../../../shared/components/club-detail-nav/club-detail-nav.component.scss', './club-members.component.scss'],
})
export class ClubMembersComponent implements OnInit {
    private readonly clubsService = inject(ClubsService);
    private readonly toast = inject(ToastService);
    private readonly fb = inject(FormBuilder).nonNullable;
    private readonly destroyRef = inject(DestroyRef);
    private readonly mediaQuery = window.matchMedia('(min-width: 1024px)');
    readonly isDesktop = signal(this.mediaQuery.matches);
    readonly store = inject(ClubDetailStore);

    @ViewChild('confirmDeleteMember') confirmDeleteMember!: ConfirmDialogComponent;

    readonly editingMember = signal<ClubMemberResponseDTO | null>(null);
    protected readonly memberToDelete = signal<ClubMemberResponseDTO | null>(null);

    readonly sortField = signal<'name' | 'rating' | 'timesMvp' | 'timesChampion'>('name');
    readonly sortDirection = signal<'asc' | 'desc'>('asc');

    readonly sortedMembers = computed(() => {
        const members = this.store.members();
        const field = this.sortField();
        const dir = this.sortDirection();

        return [...members].sort((a, b) => {
            let cmp = 0;
            switch (field) {
                case 'name':
                    cmp = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
                    break;
                case 'rating':
                    cmp = (a.rating ?? 0) - (b.rating ?? 0);
                    break;
                case 'timesMvp':
                    cmp = (a.timesMvp ?? 0) - (b.timesMvp ?? 0);
                    break;
                case 'timesChampion':
                    cmp = (a.timesChampion ?? 0) - (b.timesChampion     ?? 0);
                    break;
            }
            return dir === 'asc' ? cmp : -cmp;
        });
    });

    readonly memberForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(250)]],
        rating: [3, [Validators.min(1), Validators.max(5)]],
    });

    ngOnInit(): void {
        const clubId = this.store.clubId();
        this.clubsService.getMembers(clubId, { size: 100 })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => this.store.members.set(res.content),
                error: (err: unknown) => this.toast.error('Erro ao carregar membros.'),
            });

        const mqHandler = (e: MediaQueryListEvent) => this.isDesktop.set(e.matches);
        this.mediaQuery.addEventListener('change', mqHandler);
        this.destroyRef.onDestroy(() => this.mediaQuery.removeEventListener('change', mqHandler));
    }

    setSort(field: 'name' | 'rating' | 'timesMvp' | 'timesChampion'): void {
        if (this.sortField() === field) {
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortField.set(field);
            this.sortDirection.set('asc');
        }
    }

    onSortSelect(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const [field, direction] = target.value.split('-') as ['name' | 'rating' | 'timesMvp' | 'timesChampion', 'asc' | 'desc'];
        this.sortField.set(field);
        this.sortDirection.set(direction);
    }

    sortIndicator(field: string): string {
        if (this.sortField() !== field) return '';
        return this.sortDirection() === 'asc' ? '▲' : '▼';
    }

    addMember(): void {
        if (this.memberForm.invalid) return;
        this.clubsService.addMember(this.store.clubId(), this.memberForm.getRawValue() as AddClubMemberRequestDTO)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (m) => {
                    this.store.members.update((arr) => [...arr, m]);
                    this.memberForm.reset({ name: '', rating: 3 });
                    this.toast.success('Membro adicionado!');
                },
                error: (err: unknown) => this.toast.error('Erro ao adicionar membro.'),
            });
    }

    openEditMember(member: ClubMemberResponseDTO): void {
        this.editingMember.set(member);
    }

    closeEditMember(): void {
        this.editingMember.set(null);
    }

    saveMemberChanges(saveEvent: SaveMemberEvent): void {
        if (!this.editingMember()) return;
        const memberId = this.editingMember()!.id;
        const dto: UpdateClubMemberRequestDTO = {
            name: saveEvent.name,
            rating: saveEvent.rating,
            timesMvp: saveEvent.timesMvp,
            timesChampion: saveEvent.timesChampion,
        };
        this.clubsService.updateMember(this.store.clubId(), memberId, dto)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updatedMember) => {
                    this.store.members.update((arr) =>
                        arr.map((m) => m.id === memberId ? updatedMember : m)
                    );
                    this.closeEditMember();
                    this.toast.success('Membro atualizado!');
                },
                error: (err: unknown) => this.toast.error('Erro ao atualizar membro.'),
            });
    }

    deleteMemberConfirm(): void {
        if (!this.editingMember()) return;
        this.memberToDelete.set(this.editingMember());
        this.confirmDeleteMember?.open();
    }

    deleteSelectedMember(): void {
        const member = this.memberToDelete();
        if (!member) return;
        this.clubsService.removeMember(this.store.clubId(), member.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.store.members.update((arr) => arr.filter((m) => m.id !== member.id));
                    this.closeEditMember();
                    this.memberToDelete.set(null);
                    this.toast.success('Membro removido.');
                },
                error: (err: unknown) => this.toast.error('Erro ao remover membro.'),
            });
    }
}
