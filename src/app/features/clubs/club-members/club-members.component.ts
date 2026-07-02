import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import { ClubMemberResponseDTO } from '@core/models/api.models';
import { SquareRatingComponent } from '@shared/components/square-rating/square-rating.component';
import { ClubRolePipe } from '@shared/pipes/app.pipes';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-club-members',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        SquareRatingComponent, ClubRolePipe, ConfirmDialogComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'club-members.component.html',
    styleUrls: ['../../../shared/components/club-detail-nav/club-detail-nav.component.scss', './club-members.component.scss'],
})
export class ClubMembersComponent implements OnInit {
    private readonly clubsService = inject(ClubsService);
    private readonly toast = inject(ToastService);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    readonly store = inject(ClubDetailStore);

    @ViewChild('confirmDeleteMember') confirmDeleteMember!: ConfirmDialogComponent;

    readonly editingMember = signal<ClubMemberResponseDTO | null>(null);
    protected readonly memberToDelete = signal<ClubMemberResponseDTO | null>(null);

    readonly memberForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(250)]],
        rating: [3, [Validators.min(1), Validators.max(5)]],
    });

    readonly editMemberForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(250)]],
        rating: [1, [Validators.min(1), Validators.max(5)]],
        timesMvp: [0, [Validators.min(0)]],
        timesChampion: [0, [Validators.min(0)]],
    });

    ngOnInit(): void {
        const clubId = this.store.clubId();
        this.clubsService.getMembers(clubId, { size: 100 })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => this.store.members.set(res.content),
                error: () => this.toast.error('Erro ao carregar membros.'),
            });
    }

    addMember(): void {
        if (this.memberForm.invalid) return;
        this.clubsService.addMember(this.store.clubId(), this.memberForm.getRawValue() as any)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (m) => {
                    this.store.members.update((arr) =>
                        [...arr, m].sort((a, b) =>
                            a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
                        )
                    );
                    this.memberForm.reset({ name: '', rating: 3 });
                    this.toast.success('Membro adicionado!');
                },
                error: () => this.toast.error('Erro ao adicionar membro.'),
            });
    }

    openEditMember(member: ClubMemberResponseDTO): void {
        this.editingMember.set(member);
        this.editMemberForm.patchValue({
            name: member.name,
            rating: member.rating ?? 1,
            timesMvp: member.timesMvp ?? 0,
            timesChampion: member.timesChampion ?? 0,
        });
    }

    closeEditMember(): void {
        this.editingMember.set(null);
        this.editMemberForm.reset();
    }

    saveMemberChanges(): void {
        if (!this.editingMember() || this.editMemberForm.invalid) return;
        const memberId = this.editingMember()!.id;
        const formValue = this.editMemberForm.getRawValue();
        this.clubsService.updateMember(this.store.clubId(), memberId, {
            name: formValue.name,
            rating: formValue.rating,
            timesMvp: formValue.timesMvp,
            timesChampion: formValue.timesChampion,
        } as any)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updatedMember) => {
                    this.store.members.update((arr) =>
                        arr.map((m) => m.id === memberId ? updatedMember : m)
                    );
                    this.closeEditMember();
                    this.toast.success('Membro atualizado!');
                },
                error: () => this.toast.error('Erro ao atualizar membro.'),
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
                error: () => this.toast.error('Erro ao remover membro.'),
            });
    }
}
